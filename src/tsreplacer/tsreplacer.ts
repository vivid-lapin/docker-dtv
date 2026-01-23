import {
  basename,
  dirname,
  join,
  relative,
} from "https://deno.land/std@0.176.0/path/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.1/sleep.ts";
import { exists } from "jsr:@std/fs@1/exists";
import { parseCronExpression } from "npm:cron-schedule@6.0.0";

// EDCB-wine用tsreplace実行くん

const baseDir = Deno.env.get("BASE");
const watchDirStr = Deno.env.get("WATCH");
const exportDirStr = Deno.env.get("EXPORT");
const kariDirStr = Deno.env.get("KARI");
const ffprobePath = Deno.env.get("FFPROBE") ||
  "./thirdparty/FFmpeg/ffprobe.elf";
const encoderArgsStr = Deno.env.get("ENCODER");
const overwriteFlag = Deno.env.get("OVERWRITE") === "1";
if (!exportDirStr && !overwriteFlag) {
  console.error("EXPORT or OVERWRITE environment variable is required");
  Deno.exit(1);
}
console.log("overwrite mode:", overwriteFlag ? "enabled" : "disabled");
const sleepStr = Deno.env.get("SLEEP");

function cleanLog(text: string): string {
  // ANSIエスケープシーケンスを除去
  // deno-lint-ignore no-control-regex
  const noAnsi = text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");

  // CRLF (\r\n) を LF (\n) に置換して正規化
  const normalized = noAnsi.replace(/\r\n/g, "\n");

  // 各行を処理
  return normalized
    .split("\n")
    .map((line) => {
      // 行末に \r が残っている場合は除去
      const cleanLine = line.endsWith("\r") ? line.slice(0, -1) : line;
      // \r で区切られた場合、最後の方（上書き後の内容）を採用する
      const parts = cleanLine.split("\r");
      // ただし、空のパーツは無視して意味のある最後のテキストを探す
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].trim().length > 0) {
          return parts[i];
        }
      }
      return parts[parts.length - 1] || "";
    })
    .join("\n");
}

if (!baseDir || !watchDirStr || !kariDirStr || !encoderArgsStr) {
  console.error("WATCH, KARI, ENCODER environment variables are required");
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
let exportDir: string | null = null;
if (exportDirStr) {
  exportDir = join(baseDir, exportDirStr);
  if (!(await exists(exportDir))) {
    console.error("EXPORT directory does not exist");
    Deno.exit(1);
  }
}
const kariDir = join(baseDir, kariDirStr);
if (!(await exists(kariDir))) {
  console.error("KARI directory does not exist");
  Deno.exit(1);
}
if (ffprobePath && !(await exists(ffprobePath))) {
  console.error("FFPROBE does not exist: " + ffprobePath);
  Deno.exit(1);
}
if (sleepStr) {
  console.info("sleeping:", sleepStr);
}

const encoderArgs = encoderArgsStr.split(" ");
const watcher = Deno.watchFs(watchDir, { recursive: true });
console.info("watching:", watchDir);

for await (const event of watcher) {
  let isNotPrinted = true;
  while (true) {
    if (sleepStr && parseCronExpression(sleepStr).matchDate(new Date())) {
      if (isNotPrinted) {
        console.info("sleeping...");
        isNotPrinted = false;
      }
      await sleep(60);
      continue;
    }
    break;
  }
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
    const filePath = errPath.replace(/\.ts\.err$/, ".ts");
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
    const programPath = errPath.replace(/\.ts\.err$/, ".ts.program.txt");
    const programStat = await Deno.stat(programPath).catch(console.error);
    if (!programStat) {
      console.warn("non exists:", programPath);
      continue;
    }
    if (!programStat.isFile) {
      console.info("non-file skip:", programPath);
      continue;
    }
    const programTxt = await Deno.readTextFile(programPath).catch(
      console.error,
    );
    if (!programTxt) {
      console.warn("non exists:", programPath);
      continue;
    }
    if (programTxt.includes("tsreplacer")) {
      console.info("skip already processed:", filePath);
      continue;
    }
    const relativePath = relative(watchDir, filePath);
    const relativeErrPath = relative(watchDir, errPath);
    const relativeProgramPath = relative(watchDir, programPath);
    const exportPath = exportDir ? join(exportDir, relativePath) : null;
    const exportErrPath = exportDir ? join(exportDir, relativeErrPath) : null;
    const exportProgramPath = exportDir
      ? join(exportDir, relativeProgramPath)
      : null;
    const exportPathDir = exportPath ? dirname(exportPath) : null;
    if (exportPathDir) {
      await Deno.mkdir(exportPathDir, { recursive: true });
    }

    if (exportPath && await exists(exportPath)) {
      console.info("exists skip:", exportPath);
      continue;
    }

    // 4K は無視
    if (errFileName.includes("4K") || errFileName.includes("４Ｋ")) {
      if (exportPath && exportErrPath && exportProgramPath) {
        console.info("move only(4K):", errFileName);
        await Deno.symlink(filePath, exportPath);
        await Deno.symlink(errPath, exportErrPath);
        await Deno.symlink(programPath, exportProgramPath);
      } else {
        console.info("skip 4K:", errFileName);
      }
      continue;
    }
    const probeProcess = await new Deno.Command(ffprobePath, {
      args: [
        "-loglevel",
        "quiet",
        "-show_streams",
        filePath,
      ],
      stdout: "piped",
      stderr: "piped",
      stdin: "null",
    }).output().catch(console.error);
    if (probeProcess) {
      const probeProcessOutputText = new TextDecoder().decode(
        probeProcess.stdout,
      );
      if (probeProcessOutputText.includes("codec_name=hevc")) {
        console.info("skip hevc:", filePath);
        continue;
      }
    }

    const fileName = basename(filePath);
    const kariPath = join(kariDir, fileName);

    console.info("encoding:", filePath, "->", kariPath);
    const logFilePath = join(kariDir, `${fileName}.log`);
    const encoderProcess = new Deno.Command("tsreplace", {
      args: [
        "-i",
        filePath,
        "-o",
        kariPath,
        "--log",
        logFilePath,
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
      await Deno.remove(logFilePath).catch(console.error);
      continue;
    } else {
      let sourcePath = kariPath;
      if (overwriteFlag) {
        console.info("overwriting:", kariPath, "->", filePath);
        await Deno.rename(kariPath, filePath);
        sourcePath = filePath;
      }
      if (exportPath) {
        console.info("moving:", sourcePath, "->", exportPath);
        await Deno.symlink(sourcePath, exportPath);
      }
    }
    const logFile = await Deno.readTextFile(logFilePath);
    await Deno.writeTextFile(
      programPath,
      `\ntsreplacer encoded at ${new Date().toISOString()}\n${
        cleanLog(logFile)
      }\n`,
      { append: true },
    );
    await Deno.remove(logFilePath);
    if (exportErrPath && exportProgramPath) {
      console.info(
        "linking program data:",
        errPath,
        "->",
        exportErrPath,
        ",",
        programPath,
        "->",
        exportProgramPath,
      );
      await Deno.symlink(errPath, exportErrPath).catch(console.error);
      await Deno.symlink(programPath, exportProgramPath).catch(console.error);
    }
  }
}
