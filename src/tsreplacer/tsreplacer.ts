import {
  basename,
  dirname,
  join,
  relative,
} from "https://deno.land/std@0.176.0/path/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.1/sleep.ts";
import { exists } from "jsr:@std/fs@1/exists";

// EDCB-wine用tsreplace実行くん
// - BASE/WATCHを監視します
// - BASE/WATCH/hoge.ts.errに書き込みがあったらhoge.tsを確認し、tsreplaceでBASE/KARI/hoge.tsに出力します
// - 出力が終わったらBASE/OUT/hoge.tsに移動します
// - BASE/OUT/hoge.tsがすでに存在していたら何もしません
// - DELETEが1の場合BASE/WATCH/hoge.tsを削除し、BASE/OUT/hoge.tsからのリンクを作成します
// - 最後にBASE/OUT/hoge.ts.program.txt/hoge.ts.errをリンクとして作成します

const baseDir = Deno.env.get("BASE");
const watchDirStr = Deno.env.get("WATCH");
const outDirStr = Deno.env.get("OUT");
const kariDirStr = Deno.env.get("KARI");
const encoderArgsStr = Deno.env.get("ENCODER");
const deleteFlag = Deno.env.get("DELETE") === "1";
console.log("delete mode:", deleteFlag ? "enabled" : "disabled");

if (!baseDir || !watchDirStr || !outDirStr || !kariDirStr || !encoderArgsStr) {
  console.error("WATCH, OUT, ENCODER environment variables are required");
  Deno.exit(1);
}
if (!(await exists(baseDir))) {
  console.error("BASE directory does not exist");
}
const watchDir = join(baseDir, watchDirStr);
if (!(await exists(watchDir))) {
  console.error("WATCH directory does not exist");
  Deno.exit(1);
}
const outDir = join(baseDir, outDirStr);
if (!(await exists(outDir))) {
  console.error("OUT directory does not exist");
  Deno.exit(1);
}
const kariDir = join(baseDir, kariDirStr);
if (!(await exists(kariDir))) {
  console.error("KARI directory does not exist");
  Deno.exit(1);
}

const encoderArgs = encoderArgsStr.split(" ");
const watcher = Deno.watchFs(watchDir, { recursive: true });
console.info("watching:", watchDir);

for await (const event of watcher) {
  if (!["create", "modify"].includes(event.kind)) {
    continue;
  }
  for (const errPath of event.paths) {
    // ファイル名を抽出
    const errFileName = basename(errPath);
    // ディレクトリであれば無視
    const stat = await Deno.stat(errPath).catch(console.error);
    if (!stat) {
      console.warn("non exists:", errPath);
      continue;
    }
    if (!stat.isFile) {
      continue;
    }
    // .ts.err 以外は無視
    if (!errFileName.endsWith(".ts.err")) {
      continue;
    }
    await sleep(1);
    const filePath = errPath.replace(".ts.err", ".ts");
    const fileStat = await Deno.stat(filePath).catch(console.error);
    if (!fileStat) {
      console.warn("non exists:", filePath);
      continue;
    }
    if (!fileStat.isFile) {
      console.info("non-file skip:", filePath);
      continue;
    }
    if (fileStat.isSymlink) {
      console.info("sym-link skip:", filePath);
      continue;
    }
    const programPath = errPath.replace(".ts.err", ".ts.program.txt");
    const programStat = await Deno.stat(programPath).catch(console.error);
    if (!programStat) {
      console.warn("non exists:", programPath);
      continue;
    }
    if (!programStat.isFile) {
      console.info("non-file skip:", programPath);
      continue;
    }
    const relativePath = relative(watchDir, filePath);
    const relativeErrPath = relative(watchDir, errPath);
    const relativeProgramPath = relative(watchDir, programPath);
    const outPath = join(outDir, relativePath);
    const outErrPath = join(outDir, relativeErrPath);
    const outProgramPath = join(outDir, relativeProgramPath);
    const outPathDir = dirname(outPath);
    await Deno.mkdir(outPathDir, { recursive: true });

    if (await exists(outPath)) {
      console.info("exists skip:", outPath);
      continue;
    }

    // 4K は移動のみ
    if (errFileName.includes("4K") || errFileName.includes("４Ｋ")) {
      console.info("move only(4K):", errFileName);
      await Deno.link(filePath, outPath);
      await Deno.link(errPath, outErrPath);
      await Deno.link(programPath, outProgramPath);
      continue;
    }

    const fileName = basename(filePath);
    const kariPath = join(kariDir, fileName);

    console.info("encoding:", filePath, "->", kariPath);
    const encoderProcess = new Deno.Command("tsreplace", {
      args: [
        "-i",
        filePath,
        "-o",
        kariPath,
        "-e",
        ...encoderArgs,
      ],
      stdout: "inherit",
      stderr: "inherit",
      stdin: "null",
    }).spawn();
    // たまにtsreplaceで壊れて終わらなくなるファイルがあるので、ファイルサイズが変わってなかったらそれに陥ってるとして終了させる
    let isDone = false;
    const watcher = async () => {
      let lastSize = 0;
      await sleep(10);
      while (!isDone) {
        const stat = await Deno.stat(kariPath).catch(console.error);
        if (!stat) {
          console.warn("failed to stat:", kariPath);
          break;
        }
        const size = stat.size;
        if (size === lastSize) {
          console.warn("encoder process broken:", kariPath);
          break;
        }
        lastSize = size;
        await sleep(10);
      }
    };
    const result = await Promise.race([encoderProcess.output(), watcher()]);
    isDone = true;
    if (!result || !result.success) {
      console.error("encode failed:", filePath);
      try {
        encoderProcess.kill();
      } catch (e) {
        console.error("failed to kill encoder process:", e);
      }
      await Deno.remove(kariPath).catch(console.error);
      await Deno.link(filePath, outPath);
    } else {
      console.info("moving:", kariPath, "->", outPath);
      await Deno.rename(kariPath, outPath);
    }
    if (deleteFlag) {
      console.info("removing original file:", filePath);
      await Deno.remove(filePath);
      console.info("linking encoded path:", outPath, "->", filePath);
      await Deno.link(outPath, filePath);
    }
    console.info(
      "linking program data:",
      errPath,
      "->",
      outErrPath,
      ",",
      programPath,
      "->",
      outProgramPath,
    );
    await Deno.link(errPath, outErrPath).catch(console.error);
    await Deno.link(programPath, outProgramPath).catch(console.error);
  }
}
