"use strict";

const DEG = Math.PI / 180;
const STORAGE_KEY = "pose-master.saved-poses.v1";

const characters = {
  male: { name: "남성형", modelName: "Xbot", url: "https://threejs.org/examples/models/gltf/Xbot.glb" },
  female: { name: "여성형", modelName: "Michelle", url: "https://threejs.org/examples/models/gltf/Michelle.glb" }
};

const jointTree = {
  upper: {
    label: "상체",
    groups: {
      torso: { label: "허리·몸통", joints: [
        ["Hips", "골반"], ["Spine", "허리"], ["Spine1", "등"], ["Spine2", "가슴"], ["Neck", "목"], ["Head", "머리"]
      ] },
      leftArm: { label: "왼팔", joints: [
        ["LeftShoulder", "왼쪽 어깨뼈"], ["LeftArm", "왼쪽 위팔"], ["LeftForeArm", "왼쪽 팔꿈치"], ["LeftHand", "왼쪽 손목"]
      ] },
      rightArm: { label: "오른팔", joints: [
        ["RightShoulder", "오른쪽 어깨뼈"], ["RightArm", "오른쪽 위팔"], ["RightForeArm", "오른쪽 팔꿈치"], ["RightHand", "오른쪽 손목"]
      ] }
    }
  },
  lower: {
    label: "하체",
    groups: {
      pelvis: { label: "골반", joints: [["Hips", "골반"]] },
      leftLeg: { label: "왼쪽 다리", joints: [
        ["LeftUpLeg", "왼쪽 고관절"], ["LeftLeg", "왼쪽 무릎"], ["LeftFoot", "왼쪽 발목"], ["LeftToeBase", "왼쪽 발가락"]
      ] },
      rightLeg: { label: "오른쪽 다리", joints: [
        ["RightUpLeg", "오른쪽 고관절"], ["RightLeg", "오른쪽 무릎"], ["RightFoot", "오른쪽 발목"], ["RightToeBase", "오른쪽 발가락"]
      ] }
    }
  }
};

const upperJointIds = [
  "Spine", "Spine1", "Spine2", "Neck", "Head",
  "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand",
  "RightShoulder", "RightArm", "RightForeArm", "RightHand"
];
const lowerJointIds = [
  "Hips", "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase",
  "RightUpLeg", "RightLeg", "RightFoot", "RightToeBase"
];

const poseLibrary = {
  upper: [
    {
      id: "armsRelaxed", name: "팔 내리기",
      description: "양팔을 몸 옆으로 자연스럽게 내립니다. 현재 하체 자세는 유지됩니다.",
      joints: { LeftArm: { z: -78 }, RightArm: { z: 78 }, LeftForeArm: { x: 4 }, RightForeArm: { x: 4 } }
    },
    {
      id: "handsUp", name: "양손 들기",
      description: "양팔을 머리 위로 올립니다. 현재 하체 자세는 유지됩니다.",
      joints: {
        LeftArm: { z: 72 }, RightArm: { z: -72 }, LeftForeArm: { x: 8 }, RightForeArm: { x: 8 },
        LeftHand: { z: -8 }, RightHand: { z: 8 }
      }
    },
    {
      id: "handsAtChest", name: "가슴에 손 모으기",
      description: "두 손을 가슴 앞에서 모으는 자세입니다. 현재 하체 자세는 유지됩니다.",
      joints: {
        LeftArm: { x: -28, y: -18, z: -48 }, RightArm: { x: -28, y: 18, z: 48 },
        LeftForeArm: { x: 98, y: -12 }, RightForeArm: { x: 98, y: 12 },
        LeftHand: { z: 16 }, RightHand: { z: -16 }
      }
    },
    {
      id: "handsBehindHead", name: "손 머리 뒤로",
      description: "양손을 머리 뒤에 두고 팔꿈치를 벌립니다. 현재 하체 자세는 유지됩니다.",
      joints: {
        LeftArm: { x: -12, y: -18, z: 42 }, RightArm: { x: -12, y: 18, z: -42 },
        LeftForeArm: { x: 116, y: -34 }, RightForeArm: { x: 116, y: 34 },
        LeftHand: { z: 18 }, RightHand: { z: -18 }
      }
    },
    {
      id: "armsCrossed", name: "팔짱 끼기",
      description: "양팔을 가슴 앞에서 교차합니다. 현재 하체 자세는 유지됩니다.",
      joints: {
        LeftArm: { x: -30, y: -12, z: -42 }, RightArm: { x: -30, y: 12, z: 42 },
        LeftForeArm: { x: 106, y: -38 }, RightForeArm: { x: 106, y: 38 },
        LeftHand: { z: 20 }, RightHand: { z: -20 }
      }
    }
  ],
  lower: [
    {
      id: "standing", name: "기본 서기",
      description: "두 발로 균형을 잡은 기본 하체 자세입니다. 현재 상체 자세는 유지됩니다.",
      root: { x: 0, y: 0, z: 0 }, joints: { LeftUpLeg: { z: 2 }, RightUpLeg: { z: -2 } }
    },
    {
      id: "squat", name: "스쿼트",
      description: "엉덩이를 낮추고 무릎과 고관절을 깊게 굽힙니다. 현재 상체 자세는 유지됩니다.",
      root: { x: 0, y: -0.76, z: 0.08 },
      joints: {
        Hips: { x: 12 }, LeftUpLeg: { x: -102, z: 9 }, RightUpLeg: { x: -102, z: -9 },
        LeftLeg: { x: 118 }, RightLeg: { x: 118 }, LeftFoot: { x: -18 }, RightFoot: { x: -18 }
      }
    },
    {
      id: "mLegs", name: "M자 다리 벌리기",
      description: "몸을 낮추고 양 무릎을 바깥으로 크게 벌린 M자형 하체 자세입니다.",
      root: { x: 0, y: -0.82, z: 0.06 },
      joints: {
        Hips: { x: 8 }, LeftUpLeg: { x: -76, y: -10, z: 42 }, RightUpLeg: { x: -76, y: 10, z: -42 },
        LeftLeg: { x: 112, y: 8 }, RightLeg: { x: 112, y: -8 },
        LeftFoot: { x: -24, z: -16 }, RightFoot: { x: -24, z: 16 }
      }
    },
    {
      id: "kneeling", name: "무릎 꿇기",
      description: "양 무릎을 바닥에 대고 중심을 낮춥니다. 현재 상체 자세는 유지됩니다.",
      root: { x: 0, y: -0.68, z: 0.02 },
      joints: {
        LeftUpLeg: { x: -91, z: 5 }, RightUpLeg: { x: -91, z: -5 },
        LeftLeg: { x: 121 }, RightLeg: { x: 121 }, LeftFoot: { x: -34 }, RightFoot: { x: -34 }
      }
    },
    {
      id: "seated", name: "의자에 앉기",
      description: "허벅지를 수평으로 두고 무릎을 직각으로 굽힙니다. 현재 상체 자세는 유지됩니다.",
      root: { x: 0, y: -0.77, z: 0.02 },
      joints: {
        Hips: { x: 4 }, LeftUpLeg: { x: -90, z: 5 }, RightUpLeg: { x: -90, z: -5 },
        LeftLeg: { x: 91 }, RightLeg: { x: 91 }
      }
    },
    {
      id: "contrapposto", name: "콘트라포스토",
      description: "한쪽 다리에 체중을 싣고 골반을 기울입니다. 현재 상체 자세는 유지됩니다.",
      root: { x: 0, y: -0.03, z: 0 },
      joints: {
        Hips: { z: 7 }, LeftUpLeg: { x: -3, z: 4 }, RightUpLeg: { x: 9, z: -4 },
        RightLeg: { x: 12 }, RightFoot: { x: -8 }
      }
    }
  ],
  full: [
    {
      id: "allFours", name: "네발 기기",
      description: "몸통이 바닥을 향하도록 엎드려 양손과 양무릎을 바닥에 둡니다.",
      root: { x: 0, y: -0.62, z: 0.08 },
      joints: {
        Hips: { x: 82 }, Spine: { x: -12 }, Spine1: { x: 5 }, Spine2: { x: 5 }, Neck: { x: -12 }, Head: { x: -20 },
        LeftUpLeg: { x: -78, z: 8 }, RightUpLeg: { x: -78, z: -8 }, LeftLeg: { x: 103 }, RightLeg: { x: 103 },
        LeftFoot: { x: -25 }, RightFoot: { x: -25 }, LeftArm: { x: -18, z: -76 }, RightArm: { x: -18, z: 76 },
        LeftForeArm: { x: 12 }, RightForeArm: { x: 12 }, LeftHand: { x: -12 }, RightHand: { x: -12 }
      }
    },
    {
      id: "mermaid", name: "인어공주 자세",
      description: "바닥에 앉아 두 다리를 한쪽으로 모으고 상체를 우아하게 세웁니다.",
      root: { x: 0, y: -0.91, z: 0.02 },
      joints: {
        Hips: { z: -8 }, Spine: { z: 7 }, Spine1: { z: 5 }, Spine2: { z: 3 }, Head: { z: -4 },
        LeftUpLeg: { x: -86, y: 28, z: 13 }, RightUpLeg: { x: -72, y: 36, z: -7 },
        LeftLeg: { x: 106, y: 9 }, RightLeg: { x: 122, y: 12 }, LeftFoot: { x: -28, z: 8 }, RightFoot: { x: -32, z: 10 },
        LeftArm: { x: 24, z: -72 }, LeftForeArm: { x: 16, y: -12 }, LeftHand: { z: 12 },
        RightArm: { x: -18, y: 8, z: 52 }, RightForeArm: { x: 92, y: 8 }, RightHand: { z: -18 }
      }
    },
    {
      id: "running", name: "달리기",
      description: "팔과 다리를 서로 반대로 흔들고 몸통을 앞으로 기울인 달리기 자세입니다.",
      root: { x: 0, y: 0.08, z: 0.02 },
      joints: {
        Hips: { x: 10, y: -4 }, Spine: { x: -7 }, Spine2: { y: 9 },
        LeftUpLeg: { x: -58, z: 3 }, RightUpLeg: { x: 32, z: -3 }, LeftLeg: { x: 92 }, RightLeg: { x: 24 },
        LeftFoot: { x: -18 }, RightFoot: { x: 14 }, LeftArm: { x: 45, z: -70 }, RightArm: { x: -45, z: 70 },
        LeftForeArm: { x: 76 }, RightForeArm: { x: 82 }
      }
    }
  ]
};

let scene;
let camera;
let renderer;
let orbit;
let model;
let grid;
let currentJoint = null;
let currentCharacterId = "male";
let modelLoadToken = 0;
let activePresets = { upper: null, lower: null, full: null };

const bones = new Map();
const initialStates = new Map();
const rotations = new Map();
const rootPosition = { x: 0, y: 0, z: 0 };
const ui = {};

function normalizeBoneName(value) {
  return String(value).replace(/mixamorig|joint|bone|[^a-zA-Z0-9]/gi, "").toLowerCase();
}

function getBone(id) {
  const target = normalizeBoneName(id);
  if (bones.has(target)) return bones.get(target);
  for (const [key, bone] of bones) if (key.endsWith(target) || target.endsWith(key)) return bone;
  return null;
}

function setStatus(message, isError = false) {
  ui.statusLine.textContent = message;
  ui.statusLine.classList.toggle("error", isError);
}

function cacheUi() {
  [
    "viewport", "upperPresetGrid", "lowerPresetGrid", "fullPresetGrid", "presetDescription",
    "regionSelect", "groupSelect", "jointSelect", "jointEditorTitle", "rotationControls",
    "positionSection", "positionControls", "resetJoint", "resetPose", "copyPose",
    "statusLine", "loadingCard", "cameraReset", "gridToggle", "zoomIn", "zoomOut",
    "panelToggle", "controlPanel", "characterSwitch", "poseNameInput", "savePose", "savedPoseList"
  ].forEach((id) => { ui[id] = document.getElementById(id); });
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07111f);
  scene.fog = new THREE.Fog(0x07111f, 8, 18);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  resetCamera();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  ui.viewport.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd9efff, 0x1a2433, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x38bdf8, 0.45);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  grid = new THREE.GridHelper(16, 32, 0x35506e, 0x16283c);
  scene.add(grid);
  orbit = new THREE.OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 0.95, 0);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.075;
  orbit.minDistance = 1.35;
  orbit.maxDistance = 12;
  orbit.maxPolarAngle = Math.PI * 0.93;
  orbit.update();
  new ResizeObserver(resizeRenderer).observe(ui.viewport);
  loadCharacter("male");
  animate();
}

function resetCamera() {
  if (!camera) return;
  camera.position.set(3.15, 1.8, 5.25);
  if (orbit) { orbit.target.set(0, 0.95, 0); orbit.update(); }
}

function zoomCamera(factor) {
  if (!camera || !orbit) return;
  const offset = camera.position.clone().sub(orbit.target);
  offset.setLength(clamp(offset.length() * factor, orbit.minDistance, orbit.maxDistance));
  camera.position.copy(orbit.target).add(offset);
  orbit.update();
  setStatus(factor < 1 ? "카메라를 확대했습니다." : "카메라를 축소했습니다.");
}

function resizeRenderer() {
  const width = Math.max(ui.viewport.clientWidth, 1);
  const height = Math.max(ui.viewport.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function setLoadingState(isLoading, label = "휴머노이드 모델 준비 중") {
  ui.loadingCard.hidden = !isLoading;
  if (isLoading) {
    ui.loadingCard.querySelector("strong").textContent = label;
    ui.loadingCard.querySelector("span").textContent = "골격과 관절을 불러오고 있습니다.";
  }
  setUiEnabled(!isLoading);
}

function disposeCurrentModel() {
  if (!model) return;
  scene.remove(model);
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose?.();
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material?.dispose?.());
  });
  model = null;
}

function loadCharacter(characterId, poseToRestore = null) {
  const character = characters[characterId];
  if (!character) return;
  const token = ++modelLoadToken;
  setLoadingState(true, `${character.name} 캐릭터 준비 중`);
  setStatus(`${character.name} 캐릭터를 불러오는 중입니다…`);

  new THREE.GLTFLoader().load(character.url, (gltf) => {
    if (token !== modelLoadToken) return;
    disposeCurrentModel();
    bones.clear();
    initialStates.clear();
    rotations.clear();
    rootPosition.x = 0; rootPosition.y = 0; rootPosition.z = 0;
    model = gltf.scene;
    model.traverse((object) => {
      if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      if (!object.isBone) return;
      const key = normalizeBoneName(object.name);
      bones.set(key, object);
      initialStates.set(key, { quaternion: object.quaternion.clone(), position: object.position.clone() });
      rotations.set(key, { x: 0, y: 0, z: 0 });
    });
    scene.add(model);
    currentCharacterId = characterId;
    updateCharacterButtons();
    buildJointNavigator();
    setLoadingState(false);
    if (poseToRestore) applyPoseData(poseToRestore, { updateUi: false });
    else {
      applyPreset("upper", "armsRelaxed", { silent: true });
      applyPreset("lower", "standing", { silent: true });
    }
    if (currentJoint) selectJoint(currentJoint);
    setStatus(`${character.name} 캐릭터 준비 완료 · ${bones.size}개 골격 인식`);
  }, undefined, (error) => {
    if (token !== modelLoadToken) return;
    console.error(error);
    setLoadingState(false);
    setStatus(`${character.name} 모델을 불러오지 못했습니다.`, true);
    if (characterId !== "male") loadCharacter("male", poseToRestore);
  });
}

function switchCharacter(characterId) {
  if (characterId === currentCharacterId || !model) return;
  loadCharacter(characterId, serializePose());
}

function updateCharacterButtons() {
  ui.characterSwitch.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.character === currentCharacterId);
  });
}

function setUiEnabled(enabled) {
  [ui.regionSelect, ui.groupSelect, ui.jointSelect, ui.copyPose, ui.poseNameInput, ui.savePose]
    .forEach((element) => { element.disabled = !enabled; });
  document.querySelectorAll(".preset-button, .segment-button").forEach((button) => { button.disabled = !enabled; });
}

function renderPresets() {
  const grids = { upper: ui.upperPresetGrid, lower: ui.lowerPresetGrid, full: ui.fullPresetGrid };
  Object.entries(grids).forEach(([category, grid]) => {
    grid.replaceChildren();
    poseLibrary[category].forEach((pose) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-button";
      button.dataset.category = category;
      button.dataset.poseId = pose.id;
      button.textContent = pose.name;
      button.disabled = true;
      button.addEventListener("click", () => applyPreset(category, pose.id));
      grid.append(button);
    });
  });
}

function availableJoints(group) { return group.joints.filter(([id]) => Boolean(getBone(id))); }

function setOptions(select, entries) {
  select.replaceChildren(...entries.map(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }));
}

function buildJointNavigator() {
  const previousRegion = ui.regionSelect.value || "upper";
  const previousGroup = ui.groupSelect.value || "torso";
  setOptions(ui.regionSelect, Object.entries(jointTree).map(([id, region]) => [id, region.label]));
  ui.regionSelect.value = jointTree[previousRegion] ? previousRegion : "upper";
  updateGroupOptions(previousGroup);
}

function updateGroupOptions(preferredGroup) {
  const region = jointTree[ui.regionSelect.value];
  const entries = Object.entries(region.groups).filter(([, group]) => availableJoints(group).length).map(([id, group]) => [id, group.label]);
  setOptions(ui.groupSelect, entries);
  if (preferredGroup && entries.some(([id]) => id === preferredGroup)) ui.groupSelect.value = preferredGroup;
  updateJointOptions();
}

function updateJointOptions() {
  const group = jointTree[ui.regionSelect.value].groups[ui.groupSelect.value];
  const entries = availableJoints(group);
  setOptions(ui.jointSelect, entries);
  selectJoint(entries[0]?.[0] || null);
}

function selectJoint(jointId) {
  currentJoint = jointId;
  if (!jointId || !getBone(jointId)) {
    ui.jointEditorTitle.textContent = "사용 가능한 관절 없음";
    ui.rotationControls.replaceChildren();
    ui.resetJoint.disabled = true;
    return;
  }
  ui.jointSelect.value = jointId;
  ui.jointEditorTitle.textContent = ui.jointSelect.selectedOptions[0]?.textContent || jointId;
  ui.resetJoint.disabled = false;
  renderAxisControls(ui.rotationControls, "rotation", [-180, 180], 1, "°");
  ui.positionSection.hidden = jointId !== "Hips";
  if (jointId === "Hips") renderAxisControls(ui.positionControls, "position", [-2, 2], 0.01, "m");
}

function renderAxisControls(container, type, limits, step, unit) {
  container.replaceChildren();
  ["x", "y", "z"].forEach((axis) => {
    const value = type === "rotation" ? (rotations.get(normalizeBoneName(getBone(currentJoint)?.name))?.[axis] || 0) : rootPosition[axis];
    const row = document.createElement("div");
    row.className = "axis-control";
    row.innerHTML = `
      <span class="axis-name">${axis.toUpperCase()}</span>
      <input type="range" min="${limits[0]}" max="${limits[1]}" step="${step}" value="${value}" aria-label="${axis.toUpperCase()}축 ${type === "rotation" ? "회전" : "위치"}">
      <label class="number-wrap"><input type="number" min="${limits[0]}" max="${limits[1]}" step="${step}" value="${formatValue(value, step)}" aria-label="${axis.toUpperCase()}축 수치"><span>${unit}</span></label>`;
    const slider = row.querySelector('input[type="range"]');
    const number = row.querySelector('input[type="number"]');
    const update = (rawValue) => {
      const next = clamp(Number(rawValue), limits[0], limits[1]);
      if (!Number.isFinite(next)) return;
      slider.value = String(next);
      number.value = formatValue(next, step);
      if (type === "rotation") setJointRotation(currentJoint, axis, next);
      else setRootPosition(axis, next);
      markCustomPose();
    };
    slider.addEventListener("input", (event) => update(event.target.value));
    number.addEventListener("input", (event) => update(event.target.value));
    container.append(row);
  });
}

function formatValue(value, step) { return step < 1 ? Number(value).toFixed(2) : String(Math.round(value)); }
function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

function setJointRotation(jointId, axis, degrees) {
  const bone = getBone(jointId);
  if (!bone) return;
  const key = normalizeBoneName(bone.name);
  const values = rotations.get(key) || { x: 0, y: 0, z: 0 };
  values[axis] = Number(degrees);
  rotations.set(key, values);
  const base = initialStates.get(key);
  if (!base) return;
  const deltaEuler = new THREE.Euler(values.x * DEG, values.y * DEG, values.z * DEG, "XYZ");
  bone.quaternion.copy(base.quaternion).multiply(new THREE.Quaternion().setFromEuler(deltaEuler));
}

function setRootPosition(axis, value) {
  const hips = getBone("Hips");
  if (!hips) return;
  const base = initialStates.get(normalizeBoneName(hips.name));
  if (!base) return;
  rootPosition[axis] = Number(value);
  hips.position[axis] = base.position[axis] + rootPosition[axis];
}

function resetBone(jointId) {
  const bone = getBone(jointId);
  if (!bone) return;
  const key = normalizeBoneName(bone.name);
  const state = initialStates.get(key);
  if (!state) return;
  bone.quaternion.copy(state.quaternion);
  rotations.set(key, { x: 0, y: 0, z: 0 });
}

function resetCategory(category) {
  (category === "upper" ? upperJointIds : lowerJointIds).forEach(resetBone);
  if (category === "lower") {
    const hips = getBone("Hips");
    const base = hips && initialStates.get(normalizeBoneName(hips.name));
    if (hips && base) hips.position.copy(base.position);
    rootPosition.x = 0; rootPosition.y = 0; rootPosition.z = 0;
  }
}

function resetAll({ silent = false } = {}) {
  initialStates.forEach((state, key) => {
    const bone = bones.get(key);
    if (!bone) return;
    bone.quaternion.copy(state.quaternion);
    bone.position.copy(state.position);
    rotations.set(key, { x: 0, y: 0, z: 0 });
  });
  rootPosition.x = 0; rootPosition.y = 0; rootPosition.z = 0;
  activePresets = { upper: null, lower: null, full: null };
  updatePresetHighlight();
  if (currentJoint) selectJoint(currentJoint);
  ui.presetDescription.textContent = "T포즈로 초기화했습니다. 상체와 하체 프리셋을 조합해 보세요.";
  if (!silent) setStatus("모든 관절을 T포즈로 초기화했습니다.");
}

function resetCurrentJoint() {
  if (!currentJoint) return;
  resetBone(currentJoint);
  if (currentJoint === "Hips") {
    const hips = getBone("Hips");
    const state = hips && initialStates.get(normalizeBoneName(hips.name));
    if (hips && state) hips.position.copy(state.position);
    rootPosition.x = 0; rootPosition.y = 0; rootPosition.z = 0;
  }
  selectJoint(currentJoint);
  markCustomPose();
  setStatus(`${ui.jointEditorTitle.textContent} 관절을 초기화했습니다.`);
}

function findPreset(category, poseId) { return poseLibrary[category]?.find((pose) => pose.id === poseId) || null; }

function applyPreset(category, poseId, { silent = false } = {}) {
  const pose = findPreset(category, poseId);
  if (!pose || !model) return;
  if (category === "full") {
    resetAll({ silent: true });
    activePresets = { upper: null, lower: null, full: poseId };
  } else {
    resetCategory(category);
    activePresets[category] = poseId;
    activePresets.full = null;
  }
  Object.entries(pose.root || {}).forEach(([axis, value]) => setRootPosition(axis, value));
  Object.entries(pose.joints || {}).forEach(([jointId, values]) => {
    Object.entries(values).forEach(([axis, value]) => setJointRotation(jointId, axis, value));
  });
  updatePresetHighlight();
  ui.presetDescription.textContent = pose.description;
  if (currentJoint) selectJoint(currentJoint);
  if (!silent) setStatus(`${category === "upper" ? "상체" : category === "lower" ? "하체" : "전신"} 프리셋 적용: ${pose.name}`);
}

function markCustomPose() {
  activePresets = { upper: null, lower: null, full: null };
  updatePresetHighlight();
  ui.presetDescription.textContent = "수동으로 다듬는 중인 사용자 포즈입니다.";
}

function updatePresetHighlight() {
  document.querySelectorAll(".preset-button").forEach((button) => {
    button.classList.toggle("active", activePresets[button.dataset.category] === button.dataset.poseId);
  });
}

function allCanonicalJointIds() { return [...new Set([...upperJointIds, ...lowerJointIds])]; }

function serializePose() {
  const joints = {};
  allCanonicalJointIds().forEach((id) => {
    const bone = getBone(id);
    if (!bone) return;
    const values = rotations.get(normalizeBoneName(bone.name));
    if (values && (values.x || values.y || values.z)) joints[id] = { ...values };
  });
  return { format: "pose-master-v2", character: currentCharacterId, root: { ...rootPosition }, joints };
}

function applyPoseData(data, { updateUi = true } = {}) {
  if (!data || typeof data !== "object") return false;
  resetAll({ silent: true });
  Object.entries(data.root || {}).forEach(([axis, value]) => {
    if (["x", "y", "z"].includes(axis) && Number.isFinite(Number(value))) setRootPosition(axis, Number(value));
  });
  Object.entries(data.joints || {}).forEach(([jointId, values]) => {
    Object.entries(values || {}).forEach(([axis, value]) => {
      if (["x", "y", "z"].includes(axis) && Number.isFinite(Number(value))) setJointRotation(jointId, axis, Number(value));
    });
  });
  markCustomPose();
  if (updateUi && currentJoint) selectJoint(currentJoint);
  return true;
}

function readSavedPoses() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) { console.warn(error); return []; }
}

function writeSavedPoses(poses) { localStorage.setItem(STORAGE_KEY, JSON.stringify(poses)); }

function saveCurrentPose() {
  const name = ui.poseNameInput.value.trim();
  if (!name) { setStatus("저장할 포즈 이름을 입력해 주세요.", true); ui.poseNameInput.focus(); return; }
  const poses = readSavedPoses();
  poses.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, pose: serializePose() });
  writeSavedPoses(poses.slice(0, 30));
  ui.poseNameInput.value = "";
  renderSavedPoses();
  setStatus(`사용자 포즈 저장: ${name}`);
}

function loadSavedPose(item) {
  const targetCharacter = item.pose?.character;
  if (targetCharacter && characters[targetCharacter] && targetCharacter !== currentCharacterId) loadCharacter(targetCharacter, item.pose);
  else { applyPoseData(item.pose); setStatus(`사용자 포즈 불러오기: ${item.name}`); }
}

function deleteSavedPose(id) {
  const poses = readSavedPoses();
  const target = poses.find((item) => item.id === id);
  writeSavedPoses(poses.filter((item) => item.id !== id));
  renderSavedPoses();
  setStatus(`사용자 포즈 삭제: ${target?.name || "이름 없음"}`);
}

function renderSavedPoses() {
  const poses = readSavedPoses();
  ui.savedPoseList.replaceChildren();
  if (!poses.length) {
    const empty = document.createElement("div");
    empty.className = "saved-pose-empty";
    empty.textContent = "아직 저장한 포즈가 없습니다.";
    ui.savedPoseList.append(empty);
    return;
  }
  poses.forEach((item) => {
    const row = document.createElement("div");
    row.className = "saved-pose-item";
    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "saved-pose-load";
    loadButton.textContent = item.name;
    loadButton.addEventListener("click", () => loadSavedPose(item));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "saved-pose-delete";
    deleteButton.setAttribute("aria-label", `${item.name} 삭제`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteSavedPose(item.id));
    row.append(loadButton, deleteButton);
    ui.savedPoseList.append(row);
  });
}

async function copyPoseJson() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(serializePose(), null, 2));
    setStatus("현재 포즈 JSON을 클립보드에 복사했습니다.");
  } catch (error) { console.error(error); setStatus("클립보드 복사 권한을 허용해 주세요.", true); }
}

function bindEvents() {
  ui.regionSelect.addEventListener("change", () => updateGroupOptions());
  ui.groupSelect.addEventListener("change", updateJointOptions);
  ui.jointSelect.addEventListener("change", () => selectJoint(ui.jointSelect.value));
  ui.resetPose.addEventListener("click", () => resetAll());
  ui.resetJoint.addEventListener("click", resetCurrentJoint);
  ui.copyPose.addEventListener("click", copyPoseJson);
  ui.savePose.addEventListener("click", saveCurrentPose);
  ui.poseNameInput.addEventListener("keydown", (event) => { if (event.key === "Enter") saveCurrentPose(); });
  ui.characterSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-character]");
    if (button) switchCharacter(button.dataset.character);
  });
  ui.cameraReset.addEventListener("click", resetCamera);
  ui.zoomIn.addEventListener("click", () => zoomCamera(0.8));
  ui.zoomOut.addEventListener("click", () => zoomCamera(1.25));
  ui.gridToggle.addEventListener("click", () => {
    grid.visible = !grid.visible;
    ui.gridToggle.setAttribute("aria-pressed", String(grid.visible));
  });
  ui.panelToggle.addEventListener("click", () => ui.controlPanel.classList.toggle("collapsed"));
}

function animate() {
  requestAnimationFrame(animate);
  orbit?.update();
  renderer?.render(scene, camera);
}

function init() {
  cacheUi();
  renderPresets();
  renderSavedPoses();
  bindEvents();
  initScene();
}

window.addEventListener("DOMContentLoaded", init);
