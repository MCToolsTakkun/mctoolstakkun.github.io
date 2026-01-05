async function convert() {
  const fileInput = document.getElementById("file");
  const mode = document.getElementById("mode").value;
  const log = document.getElementById("log");

  if (!fileInput.files.length) {
    log.textContent = "ZIPを選択してください";
    return;
  }

  const zip = await JSZip.loadAsync(fileInput.files[0]);
  const outZip = new JSZip();

  if (mode === "java-to-bedrock") {
    await javaToBedrock(zip, outZip);
  } else {
    await bedrockToJava(zip, outZip);
  }

  const blob = await outZip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "converted_texture.zip";
  a.click();

  log.textContent = "変換完了！";
}

async function javaToBedrock(zip, out) {
  for (const path in zip.files) {
    if (path.startsWith("assets/minecraft/textures/")) {
      const data = await zip.files[path].async("blob");
      const newPath = path.replace(
        "assets/minecraft/textures/",
        "textures/"
      );
      out.file(newPath, data);
    }

    if (path === "pack.png") {
      out.file("pack_icon.png", await zip.files[path].async("blob"));
    }
  }

  out.file("manifest.json", JSON.stringify({
    format_version: 2,
    header: {
      name: "Converted Texture",
      description: "Java → Bedrock",
      uuid: crypto.randomUUID(),
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0]
    },
    modules: [{
      type: "resources",
      uuid: crypto.randomUUID(),
      version: [1, 0, 0]
    }]
  }, null, 2));
}

async function bedrockToJava(zip, out) {
  for (const path in zip.files) {
    if (path.startsWith("textures/")) {
      const data = await zip.files[path].async("blob");
      const newPath = "assets/minecraft/textures/" + path.replace("textures/", "");
      out.file(newPath, data);
    }

    if (path === "pack_icon.png") {
      out.file("pack.png", await zip.files[path].async("blob"));
    }
  }

  out.file("pack.mcmeta", JSON.stringify({
    pack: {
      pack_format: 15,
      description: "Bedrock → Java Converted"
    }
  }, null, 2));
}
