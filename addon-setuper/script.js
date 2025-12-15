// UUID v4
function uuidv4() {
  const rnds = new Uint8Array(16);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(rnds);
  else for (let i=0;i<16;i++) rnds[i]=Math.floor(Math.random()*256);
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;
  const hex = [...rnds].map(b => b.toString(16).padStart(2,'0'));
  return hex.slice(0,4).join('') + '-' + hex.slice(4,6).join('') + '-' + hex.slice(6,8).join('') + '-' + hex.slice(8,10).join('') + '-' + hex.slice(10,16).join('');
}

const el = id => document.getElementById(id);
const previewEl = el('preview');
const downloadBtn = el('download');

function buildManifest(opts) {
  const headerUUID = uuidv4();
  const modules = [];

  if (opts.type === 'texture' || opts.type === 'scripttexture') {
    modules.push({ type: 'resources', uuid: uuidv4(), version: opts.version });
  }
  if (opts.type === 'behavior' || opts.type === 'scriptbehavior') {
    modules.push({ type: 'data', uuid: uuidv4(), version: opts.version });
  }
  if (opts.type === 'skinpack') {
    modules.push({ type: 'skin_pack', uuid: uuidv4(), version: opts.version });
  }
  if (opts.type === 'scripttexture' || opts.type === 'scriptbehavior') {
    modules.push({ type: 'script', uuid: uuidv4(), version: opts.version, language: 'javascript', entry: opts.scriptEntry || 'scripts/main.js' });
  }

  const manifest = {
    format_version: 2,
    header: {
      name: opts.name,
      description: opts.description,
      uuid: headerUUID,
      version: opts.version,
      min_engine_version: opts.minEngineVersion
    },
    modules: modules
  };

  if (modules.some(m => m.type === 'script')) {
    manifest.dependencies = [{ module_name: "minecraft", version: opts.minEngineVersion }];
    manifest.capabilities = ["script_eval"];
  }

  return manifest;
}

function placeholderPngDataUrl() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,64,64);
  return c.toDataURL('image/png');
}

function defaultSkinsJson() {
  return {
    "serialize_name": "example_skins",
    "localization_name": "Example Skins",
    "skins": [
      {
        "localization_name": "Example",
        "geometry": "geometry.humanoid.custom",
        "texture": "textures/skin/example.png",
        "type": "free"
      }
    ]
  };
}

function createZip(manifest, opts) {
  const zip = new JSZip();
  const rootName = (opts.name || 'addon').replace(/[\\\/:*?"<>|]+/g, '_');

  if (opts.type === 'texture' || opts.type === 'scripttexture') {
    const rp = zip.folder(rootName + '/resource_pack');
    rp.file('manifest.json', JSON.stringify(manifest, null, 2));
    rp.file('pack_icon.png', placeholderPngDataUrl().split(',')[1], {base64: true});
    rp.folder('textures').file('example.png', placeholderPngDataUrl().split(',')[1], {base64: true});
  }

  if (opts.type === 'behavior' || opts.type === 'scriptbehavior') {
    const bp = zip.folder(rootName + '/behavior_pack');
    bp.file('manifest.json', JSON.stringify(manifest, null, 2));
    bp.file('pack_icon.png', placeholderPngDataUrl().split(',')[1], {base64: true});
    bp.folder('entities').file('example.entity.json', JSON.stringify({format_version:"1.10.0",minecraft: {description: {identifier: "example:entity"}}}, null, 2));
  }

  if (opts.type === 'skinpack') {
    const sp = zip.folder(rootName + '/skin_pack');
    sp.file('manifest.json', JSON.stringify(manifest, null, 2));
    sp.file('pack_icon.png', placeholderPngDataUrl().split(',')[1], {base64: true});
    sp.file('skins.json', JSON.stringify(defaultSkinsJson(), null, 2));
    sp.folder('textures').file('skin/example.png', placeholderPngDataUrl().split(',')[1], {base64: true});
  }

  if (manifest.modules.some(m => m.type === 'script')) {
    const scriptPath = opts.type === 'scripttexture' ? rootName + '/resource_pack/' : opts.type === 'scriptbehavior' ? rootName + '/behavior_pack/' : rootName + '/';
    const scriptsFolder = zip.folder(scriptPath + 'scripts');
    const entry = opts.scriptEntry || 'scripts/main.js';
    const entryName = entry.split('/').pop();
    scriptsFolder.file(entryName, `// ${opts.name} script entry\nconsole.log("Hello from script module");\n`);
  }

  return zip;
}

function setPreview(text) {
  previewEl.textContent = text;
}

function gatherOptions() {
  const type = el('packType').value;
  const name = el('name').value.trim() || 'My Addon';
  const description = el('description').value.trim() || '';
  const version = [
    parseInt(el('verMajor').value || '1', 10),
    parseInt(el('verMinor').value || '0', 10),
    parseInt(el('verPatch').value || '0', 10)
  ];
  const minEngineVersion = [
    parseInt(el('engMajor').value || '1', 10),
    parseInt(el('engMinor').value || '20', 10),
    parseInt(el('engPatch').value || '0', 10)
  ];
  const scriptEntry = el('scriptEntry').value.trim();

  return { type, name, description, version, minEngineVersion, scriptEntry };
}

el('generate').addEventListener('click', () => {
  const opts = gatherOptions();
  const manifest = buildManifest(opts);
  setPreview(JSON.stringify(manifest, null, 2));
  window._lastZip = createZip(manifest, opts);
  downloadBtn.disabled = false;
});

downloadBtn.addEventListener('click', async () => {
  if (!window._lastZip) return;
  const opts = gatherOptions();
  const rootName = (opts.name || 'addon').replace(/[\\\/:*?"<>|]+/g, '_');
  const filename = rootName + '.zip';
  const content = await window._lastZip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
});

el('reset').addEventListener('click', () => {
  el('packType').value = 'texture';
  el('name').value = 'My Addon';
  el('description').value = '';
  el('verMajor').value = 1;
  el('verMinor').value = 0;
  el('verPatch').value = 0;
  el('engMajor').value = 1;
  el('engMinor').value = 20;
  el('engPatch').value = 0;
  el('scriptEntry').value = 'scripts/main.js';
  setPreview('未生成');
  downloadBtn.disabled = true;
  window._lastZip = null;
});

// 初期化
(function init(){
  el('name').value = 'My Addon';
  el('scriptEntry').value = 'scripts/main.js';
  setPreview('未生成');
})();
