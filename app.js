"use strict";

const MODEL_URL = "https://threejs.org/examples/models/gltf/Xbot.glb";
const DEG = Math.PI / 180;

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

const poseLibrary = [
  {
    id: "neutral",
    name: "기본 서기",
    description: "팔을 자연스럽게 내리고 두 발로 균형을 잡은 중립 자세입니다.",
    root: { y: 0 },
    joints: {
      LeftArm: { z: 78 }, RightArm: { z: -78 },
      LeftForeArm: { x: 4 }, RightForeArm: { x: 4 },
      LeftUpLeg: { z: 2 }, RightUpLeg: { z: -2 }
    }
  },
  {
    id: "squat",
    name: "스쿼트",
    description: "엉덩이를 낮추고 무릎과 고관절을 깊게 굽힌 안정적인 스쿼트 자세입니다.",
    root: { y: -0.76, z: 0.08 },
    joints: {
      Hips: { x: 12 }, Spine: { x: -8 }, Spine1: { x: -6 }, Spine2: { x: -5 },
      LeftUpLeg: { x: -102, z: 9 }, RightUpLeg: { x: -102, z: -9 },
      LeftLeg: { x: 118 }, RightLeg: { x: 118 },
      LeftFoot: { x: -18 }, RightFoot: { x: -18 },
      LeftArm: { x: -62, z: 72 }, RightArm: { x: -62, z: -72 },
      LeftForeArm: { x: 18 }, RightForeArm: { x: 18 }
    }
  },
  {
    id: "mermaid",
    name: "인어공주 자세",
    description: "바닥에 앉아 두 다리를 한쪽으로 모으고 상체를 우아하게 세운 자세입니다.",
    root: { y: -0.91, z: 0.02 },
    joints: {
      Hips: { z: -8 }, Spine: { z: 7 }, Spine1: { z: 5 }, Spine2: { z: 3 }, Head: { z: -4 },
      LeftUpLeg: { x: -86, y: 28, z: 13 }, RightUpLeg: { x: -72, y: 36, z: -7 },
      LeftLeg: { x: 106, y: 9 }, RightLeg: { x: 122, y: 12 },
      LeftFoot: { x: -28, z: 8 }, RightFoot: { x: -32, z: 10 },
      LeftArm: { x: 24, z: 72 }, LeftForeArm: { x: 16, y: -12 }, LeftHand: { z: 12 },
      RightArm: { x: -18, y: 8, z: -52 }, RightForeArm: { x: 92, y: 8 }, RightHand: { z: -18 }
    }
  },
  {
    id: "allFours",
    name: "네발 기기",
    description: "양손과 양무릎을 바닥에 둔 all fours 자세입니다. 허리와 목 각도도 함께 조정했습니다.",
    root: { y: -0.63, z: 0.08 },
    joints: {
      Hips: { x: -82 }, Spine: { x: 15 }, Spine1: { x: -8 }, Spine2: { x: -5 }, Neck: { x: 18 }, Head: { x: 24 },
      LeftUpLeg: { x: -80, z: 8 }, RightUpLeg: { x: -80, z: -8 },
      LeftLeg: { x: 103 }, RightLeg: { x: 103 }, LeftFoot: { x: -25 }, RightFoot: { x: -25 },
      LeftArm: { x: 4, z: 82 }, RightArm: { x: 4, z: -82 },
      LeftForeArm: { x: 10 }, RightForeArm: { x: 10 }, LeftHand: { x: -12 }, RightHand: { x: -12 }
    }
  },
  {
    id: "kneeling",
    name: "무릎 꿇기",
    description: "양 무릎을 바닥에 대고 발뒤꿈치 쪽으로 중심을 낮춘 자세입니다.",
    root: { y: -0.68, z: 0.02 },
    joints: {
      LeftUpLeg: { x: -91, z: 5 }, RightUpLeg: { x: -91, z: -5 },
      LeftLeg: { x: 121 }, RightLeg: { x: 121 }, LeftFoot: { x: -34 }, RightFoot: { x: -34 },
      LeftArm: { z: 78 }, RightArm: { z: -78 },
      LeftForeArm: { x: 8 }, RightForeArm: { x: 8 }
    }
  },
  {
    id: "seated",
    name: "의자에 앉기",
    description: "허벅지를 수평으로 두고 무릎을 직각으로 굽힌 기본 착석 자세입니다.",
    root: { y: -0.77, z: 0.02 },
    joints: {
      Hips: { x: 4 }, Spine: { x: -4 },
      LeftUpLeg: { x: -90, z: 5 }, RightUpLeg: { x: -90, z: -5 },
      LeftLeg: { x: 91 }, RightLeg: { x: 91 },
      LeftArm: { x: -18, z: 72 }, RightArm: { x: -18, z: -72 },
      LeftForeArm: { x: 74 }, RightForeArm: { x: 74 }
    }
  },
  {
    id: "running",
    name: "달리기",
    description: "팔과 다리를 서로 반대로 흔들고 몸통을 앞으로 기울인 달리기 동작입니다.",
    root: { y: 0.08, z: 0.02 },
    joints: {
      Hips: { x: 10, y: -4 }, Spine: { x: -7 }, Spine2: { y: 9 },
      LeftUpLeg: { x: -58, z: 3 }, RightUpLeg: { x: 32, z: -3 },
      LeftLeg: { x: 92 }, RightLeg: { x: 24 }, LeftFoot: { x: -18 }, RightFoot: { x: 14 },
      LeftArm: { x: 45, z: 78 }, RightArm: { x: -45, z: -78 },
      LeftForeArm: { x: 76 }, RightForeArm: { x: 82 }
    }
  },
  {
    id: "contrapposto",
    name: "콘트라포스토",
    description: "한쪽 다리에 체중을 싣고 골반과 어깨를 반대 방향으로 기울인 자연스러운 서기 자세입니다.",
    root: { y: -0.03 },
    joints: {
      Hips: { z: 7 }, Spine: { z: -4 }, Spine1: { z: -3 }, Spine2: { z: -3 }, Head: { z: 2 },
      LeftUpLeg: { x: -3, z: 4 }, RightUpLeg: { x: 9, z: -4 }, RightLeg: { x: 12 }, RightFoot: { x: -8 },
      LeftArm: { x: -6, z: 74 }, RightArm: { x: 5, z: -82 },
      LeftForeArm: { x: 10 }, RightForeArm: { x: 5 }
    }
  }
];

let scene;
let camera;
let renderer;
let orbit;
let model;
let grid;
let currentJoint = null;
let activePresetId = null;

const bones = new Map();
const initialStates = new Map();
const rotations = new Map();
const rootPosition = { x: 0, y: 0, z: 0 };

const ui = {};

function normalizeBoneName(value) {
  return value.replace(/mixamorig|joint|bone|[^a-zA-Z0-9]/gi, "").toLowerCase();
}

function getBone(id) {
  return bones.get(normalizeBoneName(id)) || null;
}

function setStatus(message, isError = false) {
  ui.statusLine.textContent = message;
  ui.statusLine.classList.toggle("error", isError);
}

function cacheUi() {
  [
    "viewport", "presetGrid", "presetDescription", "regionSelect", "groupSelect", "jointSelect",
    "jointEditorTitle", "rotationControls", "positionSection", "positionControls", "resetJoint",
    "resetPose", "copyPose", "statusLine", "loadingCard", "cameraReset", "gridToggle",
    "panelToggle", "controlPanel"
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

  const hemi = new THREE.HemisphereLight(0xd9efff, 0x1a2433, 1.25);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x38bdf8, 0.45);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  grid = new THREE.GridHelper(16, 32, 0x35506e, 0x16283c);
  grid.position.y = 0;
  scene.add(grid);

  orbit = new THREE.OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 0.95, 0);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.075;
  orbit.minDistance = 2.2;
  orbit.maxDistance = 10;
  orbit.maxPolarAngle = Math.PI * 0.93;
  orbit.update();

  const resizeObserver = new ResizeObserver(resizeRenderer);
  resizeObserver.observe(ui.viewport);

  loadModel();
  animate();
}

function resetCamera() {
  if (!camera) return;
  camera.position.set(3.15, 1.8, 5.25);
  if (orbit) {
    orbit.target.set(0, 0.95, 0);
    orbit.update();
  }
}

function resizeRenderer() {
  const width = Math.max(ui.viewport.clientWidth, 1);
  const height = Math.max(ui.viewport.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function loadModel() {
  const loader = new THREE.GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;
      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
        if (object.isBone) {
          const key = normalizeBoneName(object.name);
          bones.set(key, object);
          initialStates.set(key, {
            quaternion: object.quaternion.clone(),
            position: object.position.clone()
          });
          rotations.set(key, { x: 0, y: 0, z: 0 });
        }
      });
      scene.add(model);
      buildJointNavigator();
      setUiEnabled(true);
      ui.loadingCard.hidden = true;
      setStatus(`모델 준비 완료 · ${bones.size}개 골격 인식`);
      applyPreset("neutral");
    },
    undefined,
    (error) => {
      console.error(error);
      ui.loadingCard.querySelector(".spinner").remove();
      ui.loadingCard.querySelector("strong").textContent = "모델을 불러오지 못했습니다";
      ui.loadingCard.querySelector("span").textContent = "인터넷 연결을 확인한 뒤 페이지를 새로고침해 주세요.";
      setStatus("Xbot 모델 로드 실패", true);
    }
  );
}

function setUiEnabled(enabled) {
  [ui.regionSelect, ui.groupSelect, ui.jointSelect, ui.copyPose].forEach((element) => { element.disabled = !enabled; });
  ui.presetGrid.querySelectorAll("button").forEach((button) => { button.disabled = !enabled; });
}

function renderPresets() {
  ui.presetGrid.replaceChildren();
  poseLibrary.forEach((pose) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";
    button.dataset.poseId = pose.id;
    button.textContent = pose.name;
    button.disabled = true;
    button.addEventListener("click", () => applyPreset(pose.id));
    ui.presetGrid.append(button);
  });
}

function availableJoints(group) {
  return group.joints.filter(([id]) => Boolean(getBone(id)));
}

function setOptions(select, entries) {
  select.replaceChildren(...entries.map(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }));
}

function buildJointNavigator() {
  setOptions(ui.regionSelect, Object.entries(jointTree).map(([id, region]) => [id, region.label]));
  ui.regionSelect.value = "upper";
  updateGroupOptions("torso");
}

function updateGroupOptions(preferredGroup) {
  const region = jointTree[ui.regionSelect.value];
  const entries = Object.entries(region.groups)
    .filter(([, group]) => availableJoints(group).length)
    .map(([id, group]) => [id, group.label]);
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
  if (!jointId) {
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
    const value = type === "rotation"
      ? (rotations.get(normalizeBoneName(currentJoint))?.[axis] || 0)
      : rootPosition[axis];
    const row = document.createElement("div");
    row.className = "axis-control";
    row.innerHTML = `
      <span class="axis-name">${axis.toUpperCase()}</span>
      <input type="range" min="${limits[0]}" max="${limits[1]}" step="${step}" value="${value}" aria-label="${axis.toUpperCase()}축 ${type === "rotation" ? "회전" : "위치"}">
      <label class="number-wrap">
        <input type="number" min="${limits[0]}" max="${limits[1]}" step="${step}" value="${formatValue(value, step)}" aria-label="${axis.toUpperCase()}축 수치">
        <span>${unit}</span>
      </label>`;
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

function formatValue(value, step) {
  return step < 1 ? Number(value).toFixed(2) : String(Math.round(value));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setJointRotation(jointId, axis, degrees) {
  const bone = getBone(jointId);
  if (!bone) return;
  const key = normalizeBoneName(jointId);
  const values = rotations.get(key) || { x: 0, y: 0, z: 0 };
  values[axis] = Number(degrees);
  rotations.set(key, values);

  const base = initialStates.get(key);
  const deltaEuler = new THREE.Euler(values.x * DEG, values.y * DEG, values.z * DEG, "XYZ");
  const deltaQuaternion = new THREE.Quaternion().setFromEuler(deltaEuler);
  bone.quaternion.copy(base.quaternion).multiply(deltaQuaternion);
}

function setRootPosition(axis, value) {
  const hips = getBone("Hips");
  const base = initialStates.get(normalizeBoneName("Hips"));
  if (!hips || !base) return;
  rootPosition[axis] = Number(value);
  hips.position[axis] = base.position[axis] + rootPosition[axis];
}

function resetAll({ silent = false } = {}) {
  initialStates.forEach((state, key) => {
    const bone = bones.get(key);
    if (!bone) return;
    bone.quaternion.copy(state.quaternion);
    bone.position.copy(state.position);
    rotations.set(key, { x: 0, y: 0, z: 0 });
  });
  rootPosition.x = 0;
  rootPosition.y = 0;
  rootPosition.z = 0;
  activePresetId = null;
  updatePresetHighlight();
  if (currentJoint) selectJoint(currentJoint);
  ui.presetDescription.textContent = "T포즈로 초기화했습니다. 원하는 관절을 선택해 수치로 조절하세요.";
  if (!silent) setStatus("모든 관절을 T포즈로 초기화했습니다.");
}

function resetCurrentJoint() {
  if (!currentJoint) return;
  const key = normalizeBoneName(currentJoint);
  const bone = getBone(currentJoint);
  const state = initialStates.get(key);
  if (!bone || !state) return;
  bone.quaternion.copy(state.quaternion);
  rotations.set(key, { x: 0, y: 0, z: 0 });
  if (currentJoint === "Hips") {
    bone.position.copy(state.position);
    rootPosition.x = 0;
    rootPosition.y = 0;
    rootPosition.z = 0;
  }
  selectJoint(currentJoint);
  markCustomPose();
  setStatus(`${ui.jointEditorTitle.textContent} 관절을 초기화했습니다.`);
}

function applyPreset(poseId) {
  const pose = poseLibrary.find((item) => item.id === poseId);
  if (!pose || !model) return;
  resetAll({ silent: true });
  Object.entries(pose.root || {}).forEach(([axis, value]) => setRootPosition(axis, value));
  Object.entries(pose.joints).forEach(([jointId, values]) => {
    Object.entries(values).forEach(([axis, value]) => setJointRotation(jointId, axis, value));
  });
  activePresetId = poseId;
  updatePresetHighlight();
  ui.presetDescription.textContent = pose.description;
  if (currentJoint) selectJoint(currentJoint);
  setStatus(`프리셋 적용: ${pose.name}`);
}

function markCustomPose() {
  activePresetId = null;
  updatePresetHighlight();
  ui.presetDescription.textContent = "수동으로 다듬는 중인 사용자 포즈입니다.";
}

function updatePresetHighlight() {
  ui.presetGrid.querySelectorAll(".preset-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.poseId === activePresetId);
  });
}

function serializePose() {
  const joints = {};
  rotations.forEach((values, key) => {
    if (values.x || values.y || values.z) {
      const bone = bones.get(key);
      joints[bone?.name || key] = { ...values };
    }
  });
  return {
    format: "pose-master-v1",
    model: "Xbot",
    root: { ...rootPosition },
    joints
  };
}

async function copyPoseJson() {
  const json = JSON.stringify(serializePose(), null, 2);
  try {
    await navigator.clipboard.writeText(json);
    setStatus("현재 포즈 JSON을 클립보드에 복사했습니다.");
  } catch (error) {
    console.error(error);
    setStatus("클립보드 복사 권한을 허용해 주세요.", true);
  }
}

function bindEvents() {
  ui.regionSelect.addEventListener("change", () => updateGroupOptions());
  ui.groupSelect.addEventListener("change", updateJointOptions);
  ui.jointSelect.addEventListener("change", () => selectJoint(ui.jointSelect.value));
  ui.resetPose.addEventListener("click", () => resetAll());
  ui.resetJoint.addEventListener("click", resetCurrentJoint);
  ui.copyPose.addEventListener("click", copyPoseJson);
  ui.cameraReset.addEventListener("click", resetCamera);
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
  bindEvents();
  initScene();
}

window.addEventListener("DOMContentLoaded", init);
