"use strict";

const DEG = Math.PI / 180;
const STORAGE_KEY = "pose-master.saved-poses.v1";
const MODEL_URL = "https://threejs.org/examples/models/gltf/Xbot.glb";
const MAX_ACTORS = 6;

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
      description: "몸통과 얼굴이 바닥을 향하도록 엎드려 양손과 양무릎으로 지지합니다.",
      root: { x: 0, y: -0.72, z: 0.08 },
      joints: {
        Hips: { x: 88 }, Spine: { x: -8 }, Spine1: { x: 4 }, Spine2: { x: 4 }, Neck: { x: -15 }, Head: { x: -16 },
        LeftUpLeg: { x: -82, z: 9 }, RightUpLeg: { x: -82, z: -9 }, LeftLeg: { x: 104 }, RightLeg: { x: 104 },
        LeftFoot: { x: -24 }, RightFoot: { x: -24 }, LeftArm: { x: -10, z: -78 }, RightArm: { x: -10, z: 78 },
        LeftForeArm: { x: 8 }, RightForeArm: { x: 8 }, LeftHand: { x: -8 }, RightHand: { x: -8 }
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
let grid;
let selectionRing;
let currentJoint = null;
let activeActorId = null;
let actorSequence = 0;
let isLoadingActor = false;
let editingSavedPoseId = null;
let snapshotDataUrl = null;
let snapshotFilename = null;
let isConstrainingOrbit = false;

const actors = [];
const ui = {};

function normalizeBoneName(value) {
  return String(value).replace(/mixamorig|joint|bone|[^a-zA-Z0-9]/gi, "").toLowerCase();
}

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function formatValue(value, step) { return step < 1 ? Number(value).toFixed(2) : String(Math.round(value)); }
function getActiveActor() { return actors.find((actor) => actor.id === activeActorId) || null; }

function getBone(jointId, actor = getActiveActor()) {
  if (!actor) return null;
  const target = normalizeBoneName(jointId);
  if (actor.bones.has(target)) return actor.bones.get(target);
  for (const [key, bone] of actor.bones) if (key.endsWith(target) || target.endsWith(key)) return bone;
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
    "cameraUp", "cameraDown", "cameraLeft", "cameraRight", "panelToggle", "controlPanel", "panelTabs",
    "poseNameInput", "savePose", "cancelPoseEdit", "savedPoseList", "addActor", "actorList",
    "actorPositionControls", "fitAllActors", "captureSnapshot", "snapshotDialog",
    "snapshotPreview", "snapshotClose", "snapshotDownload", "snapshotShare"
  ].forEach((id) => { ui[id] = document.getElementById(id); });
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07111f);
  scene.fog = new THREE.Fog(0x07111f, 10, 24);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(3.15, 1.8, 5.25);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true });
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
  selectionRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.37, 48),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.position.y = 0.012;
  selectionRing.visible = false;
  scene.add(selectionRing);

  orbit = new THREE.OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 0.95, 0);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.075;
  orbit.enablePan = true;
  orbit.screenSpacePanning = true;
  orbit.minDistance = 1.2;
  orbit.maxDistance = 20;
  orbit.minPolarAngle = 0.08;
  orbit.maxPolarAngle = Math.PI / 2 - 0.02;
  orbit.addEventListener("change", constrainOrbitToActors);
  orbit.update();

  new ResizeObserver(resizeRenderer).observe(ui.viewport);
  addActor();
  animate();
}

function resizeRenderer() {
  const width = Math.max(ui.viewport.clientWidth, 1);
  const height = Math.max(ui.viewport.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function getActorsBounds() {
  const bounds = new THREE.Box3();
  const bonePosition = new THREE.Vector3();
  scene.updateMatrixWorld(true);
  actors.forEach((actor) => {
    const actorBounds = new THREE.Box3();
    actor.bones.forEach((bone) => {
      actorBounds.expandByPoint(bone.getWorldPosition(bonePosition));
    });
    if (actorBounds.isEmpty()) actorBounds.setFromObject(actor.model);
    actorBounds.expandByScalar(0.14);
    bounds.union(actorBounds);
  });
  return bounds;
}

function fitCameraToActors({ announce = true } = {}) {
  if (!camera || !orbit || !actors.length) return;
  const bounds = getActorsBounds();
  if (bounds.isEmpty()) return;
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const verticalFov = camera.fov * DEG;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.2));
  const byHeight = size.y / (2 * Math.tan(verticalFov / 2));
  const byWidth = size.x / (2 * Math.tan(horizontalFov / 2));
  const distance = clamp(Math.max(byHeight, byWidth, 1.5) * 1.32, 1.8, orbit.maxDistance);
  orbit.target.copy(center);
  camera.position.set(center.x, center.y, bounds.max.z + distance);
  orbit.update();
  if (announce) setStatus(`모든 인물 ${actors.length}명의 전신을 정면 화면에 맞췄습니다.`);
}

function constrainOrbitToActors() {
  if (isConstrainingOrbit || !camera || !orbit || !actors.length) return;
  const bounds = getActorsBounds();
  if (bounds.isEmpty()) return;
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const distance = camera.position.distanceTo(orbit.target);
  const viewHalfHeight = Math.tan(camera.fov * DEG / 2) * distance;
  const viewHalfWidth = viewHalfHeight * Math.max(camera.aspect, 0.2);
  const maxOffsetX = viewHalfWidth * 0.72 + size.x * 0.25;
  const maxOffsetY = viewHalfHeight * 0.72 + size.y * 0.25;
  const maxOffsetZ = Math.max(viewHalfWidth * 0.72 + size.z * 0.25, 0.45);
  const previous = orbit.target.clone();
  const minTargetY = Math.max(center.y - maxOffsetY, 0.05);
  orbit.target.set(
    clamp(orbit.target.x, center.x - maxOffsetX, center.x + maxOffsetX),
    clamp(orbit.target.y, minTargetY, center.y + maxOffsetY),
    clamp(orbit.target.z, center.z - maxOffsetZ, center.z + maxOffsetZ)
  );
  const correction = orbit.target.clone().sub(previous);
  if (correction.lengthSq() === 0) return;
  isConstrainingOrbit = true;
  camera.position.add(correction);
  isConstrainingOrbit = false;
}

function resetCamera() { fitCameraToActors(); }

function zoomCamera(factor) {
  if (!camera || !orbit) return;
  const offset = camera.position.clone().sub(orbit.target);
  offset.setLength(clamp(offset.length() * factor, orbit.minDistance, orbit.maxDistance));
  camera.position.copy(orbit.target).add(offset);
  orbit.update();
  setStatus(factor < 1 ? "카메라를 확대했습니다." : "카메라를 축소했습니다.");
}

function panCameraScreen(horizontal, vertical) {
  if (!camera || !orbit) return;
  camera.updateMatrixWorld(true);
  const step = clamp(camera.position.distanceTo(orbit.target) * 0.07, 0.14, 0.5);
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  const movement = right.multiplyScalar(horizontal * step).add(up.multiplyScalar(vertical * step));
  camera.position.add(movement);
  orbit.target.add(movement);
  constrainOrbitToActors();
  orbit.update();
  const direction = horizontal < 0 ? "왼쪽" : horizontal > 0 ? "오른쪽" : vertical > 0 ? "위" : "아래";
  setStatus(`화면을 ${direction}으로 이동했습니다.`);
}

function setLoadingState(isLoading, label = "휴머노이드 모델 준비 중") {
  isLoadingActor = isLoading;
  ui.loadingCard.hidden = !isLoading;
  if (isLoading) {
    ui.loadingCard.querySelector("strong").textContent = label;
    ui.loadingCard.querySelector("span").textContent = "기본형 Xbot의 골격과 관절을 불러오고 있습니다.";
  }
  setUiEnabled();
}

function setUiEnabled() {
  const enabled = Boolean(getActiveActor()) && !isLoadingActor;
  [ui.regionSelect, ui.groupSelect, ui.jointSelect, ui.copyPose, ui.poseNameInput, ui.savePose, ui.resetPose, ui.fitAllActors, ui.captureSnapshot]
    .forEach((element) => { element.disabled = !enabled; });
  ui.addActor.disabled = isLoadingActor || actors.length >= MAX_ACTORS;
  document.querySelectorAll(".preset-button").forEach((button) => { button.disabled = !enabled; });
}

function findAvailableActorX() {
  const candidates = [0, 0.9, -0.9, 1.8, -1.8, 2.7, -2.7];
  return candidates.find((candidate) => actors.every((actor) => Math.abs(actor.worldPosition.x - candidate) > 0.25)) ?? 0;
}

function createActor(gltf, index) {
  const actor = {
    id: `actor-${Date.now()}-${++actorSequence}`,
    name: `인물 ${index}`,
    model: gltf.scene,
    bones: new Map(),
    initialStates: new Map(),
    rotations: new Map(),
    rootPosition: { x: 0, y: 0, z: 0 },
    worldPosition: { x: findAvailableActorX(), y: 0, z: 0 },
    activePresets: { upper: null, lower: null, full: null }
  };
  actor.model.position.set(actor.worldPosition.x, actor.worldPosition.y, actor.worldPosition.z);
  actor.model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      // Skinned meshes keep their bind-pose bounds, which can be culled incorrectly
      // after large joint rotations when the camera is nearly parallel to the grid.
      object.frustumCulled = false;
    }
    if (!object.isBone) return;
    const key = normalizeBoneName(object.name);
    actor.bones.set(key, object);
    actor.initialStates.set(key, { quaternion: object.quaternion.clone(), position: object.position.clone() });
    actor.rotations.set(key, { x: 0, y: 0, z: 0 });
  });
  return actor;
}

function addActor() {
  if (isLoadingActor || actors.length >= MAX_ACTORS) return;
  const nextIndex = actors.length + 1;
  setLoadingState(true, `${nextIndex}번째 인물 준비 중`);
  setStatus(`기본형 인물 ${nextIndex}을 추가하는 중입니다…`);
  new THREE.GLTFLoader().load(MODEL_URL, (gltf) => {
    const actor = createActor(gltf, nextIndex);
    scene.add(actor.model);
    actors.push(actor);
    activeActorId = actor.id;
    resetSavedPoseEditor();
    applyPreset("upper", "armsRelaxed", { actor, silent: true, fit: false });
    applyPreset("lower", "standing", { actor, silent: true, fit: false });
    setLoadingState(false);
    syncActiveActorUi();
    requestAnimationFrame(() => fitCameraToActors({ announce: false }));
    setStatus(`${actor.name} 추가 완료 · 총 ${actors.length}명 · ${actor.bones.size}개 골격 인식`);
  }, undefined, (error) => {
    console.error(error);
    setLoadingState(false);
    setStatus("기본형 인물 모델을 불러오지 못했습니다.", true);
  });
}

function disposeActor(actor) {
  scene.remove(actor.model);
  actor.model.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose?.();
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material?.dispose?.());
  });
}

function deleteActor(actorId) {
  if (actors.length <= 1) { setStatus("인물은 최소 한 명이 필요합니다.", true); return; }
  const index = actors.findIndex((actor) => actor.id === actorId);
  if (index < 0) return;
  const [removed] = actors.splice(index, 1);
  disposeActor(removed);
  actors.forEach((actor, actorIndex) => { actor.name = `인물 ${actorIndex + 1}`; });
  if (activeActorId === actorId) {
    activeActorId = actors[Math.min(index, actors.length - 1)].id;
    resetSavedPoseEditor();
  }
  syncActiveActorUi();
  fitCameraToActors({ announce: false });
  setStatus(`${removed.name}을 삭제했습니다. 현재 ${actors.length}명입니다.`);
}

function selectActor(actorId) {
  if (!actors.some((actor) => actor.id === actorId)) return;
  if (activeActorId !== actorId) resetSavedPoseEditor();
  activeActorId = actorId;
  syncActiveActorUi();
  setStatus(`${getActiveActor().name}을 선택했습니다. 포즈와 위치 조절은 이 인물에 적용됩니다.`);
}

function syncActiveActorUi() {
  renderActorList();
  renderActorPositionControls();
  updateSelectionRing();
  buildJointNavigator();
  updatePresetHighlight();
  if (currentJoint) selectJoint(currentJoint);
  setUiEnabled();
}

function updateSelectionRing() {
  const actor = getActiveActor();
  selectionRing.visible = Boolean(actor);
  if (!actor) return;
  selectionRing.position.set(actor.worldPosition.x, actor.worldPosition.y + 0.012, actor.worldPosition.z);
}

function renderActorList() {
  ui.actorList.replaceChildren();
  actors.forEach((actor) => {
    const row = document.createElement("div");
    row.className = `actor-item${actor.id === activeActorId ? " active" : ""}`;
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "actor-select";
    selectButton.innerHTML = `<strong>${actor.name}</strong><small>X ${actor.worldPosition.x.toFixed(2)} · Y ${actor.worldPosition.y.toFixed(2)} · Z ${actor.worldPosition.z.toFixed(2)}</small>`;
    selectButton.addEventListener("click", () => selectActor(actor.id));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "actor-delete";
    deleteButton.setAttribute("aria-label", `${actor.name} 삭제`);
    deleteButton.textContent = "×";
    deleteButton.disabled = actors.length <= 1;
    deleteButton.addEventListener("click", () => deleteActor(actor.id));
    row.append(selectButton, deleteButton);
    ui.actorList.append(row);
  });
}

function setActorPosition(axis, value) {
  const actor = getActiveActor();
  if (!actor) return;
  actor.worldPosition[axis] = Number(value);
  actor.model.position[axis] = actor.worldPosition[axis];
  updateSelectionRing();
  renderActorList();
}

function renderActorPositionControls() {
  const actor = getActiveActor();
  ui.actorPositionControls.replaceChildren();
  if (!actor) return;
  const labels = { x: "X 좌우", y: "Y 상하", z: "Z 전후" };
  ["x", "y", "z"].forEach((axis) => {
    appendAxisControl(ui.actorPositionControls, {
      label: labels[axis], value: actor.worldPosition[axis], min: -4, max: 4, step: 0.05, unit: "m",
      onInput: (next) => setActorPosition(axis, next), onCommit: () => setStatus(`${actor.name}의 ${labels[axis]} 위치를 변경했습니다.`)
    });
  });
}

function renderPresets() {
  const grids = { upper: ui.upperPresetGrid, lower: ui.lowerPresetGrid, full: ui.fullPresetGrid };
  Object.entries(grids).forEach(([category, target]) => {
    target.replaceChildren();
    poseLibrary[category].forEach((pose) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-button";
      button.dataset.category = category;
      button.dataset.poseId = pose.id;
      button.textContent = pose.name;
      button.disabled = true;
      button.addEventListener("click", () => applyPreset(category, pose.id));
      target.append(button);
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
  if (!getActiveActor()) return;
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
  const group = jointTree[ui.regionSelect.value]?.groups[ui.groupSelect.value];
  const entries = group ? availableJoints(group) : [];
  setOptions(ui.jointSelect, entries);
  selectJoint(entries.some(([id]) => id === currentJoint) ? currentJoint : entries[0]?.[0] || null);
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
  renderRotationControls();
  ui.positionSection.hidden = jointId !== "Hips";
  if (jointId === "Hips") renderRootPositionControls();
}

function appendAxisControl(container, { label, value, min, max, step, unit, onInput, onCommit }) {
  const row = document.createElement("div");
  row.className = "axis-control";
  row.innerHTML = `
    <span class="axis-name">${label}</span>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label} 조절">
    <label class="number-wrap"><input type="number" min="${min}" max="${max}" step="${step}" value="${formatValue(value, step)}" aria-label="${label} 수치"><span>${unit}</span></label>`;
  const slider = row.querySelector('input[type="range"]');
  const number = row.querySelector('input[type="number"]');
  const update = (rawValue) => {
    const next = clamp(Number(rawValue), min, max);
    if (!Number.isFinite(next)) return;
    slider.value = String(next);
    number.value = formatValue(next, step);
    onInput(next);
  };
  slider.addEventListener("input", (event) => update(event.target.value));
  number.addEventListener("input", (event) => update(event.target.value));
  slider.addEventListener("change", () => onCommit?.());
  number.addEventListener("change", () => onCommit?.());
  container.append(row);
}

function renderRotationControls() {
  const actor = getActiveActor();
  const bone = getBone(currentJoint, actor);
  ui.rotationControls.replaceChildren();
  if (!actor || !bone) return;
  const values = actor.rotations.get(normalizeBoneName(bone.name)) || { x: 0, y: 0, z: 0 };
  ["x", "y", "z"].forEach((axis) => {
    appendAxisControl(ui.rotationControls, {
      label: axis.toUpperCase(), value: values[axis], min: -180, max: 180, step: 1, unit: "°",
      onInput: (next) => { setJointRotation(currentJoint, axis, next, actor); markCustomPose(actor); }
    });
  });
}

function renderRootPositionControls() {
  const actor = getActiveActor();
  ui.positionControls.replaceChildren();
  if (!actor) return;
  ["x", "y", "z"].forEach((axis) => {
    appendAxisControl(ui.positionControls, {
      label: axis.toUpperCase(), value: actor.rootPosition[axis], min: -2, max: 2, step: 0.01, unit: "m",
      onInput: (next) => { setRootPosition(axis, next, actor); markCustomPose(actor); }
    });
  });
}

function setJointRotation(jointId, axis, degrees, actor = getActiveActor()) {
  const bone = getBone(jointId, actor);
  if (!actor || !bone) return;
  const key = normalizeBoneName(bone.name);
  const values = actor.rotations.get(key) || { x: 0, y: 0, z: 0 };
  values[axis] = Number(degrees);
  actor.rotations.set(key, values);
  const base = actor.initialStates.get(key);
  if (!base) return;
  const delta = new THREE.Euler(values.x * DEG, values.y * DEG, values.z * DEG, "XYZ");
  bone.quaternion.copy(base.quaternion).multiply(new THREE.Quaternion().setFromEuler(delta));
}

function setRootPosition(axis, value, actor = getActiveActor()) {
  const hips = getBone("Hips", actor);
  if (!actor || !hips) return;
  const base = actor.initialStates.get(normalizeBoneName(hips.name));
  if (!base) return;
  actor.rootPosition[axis] = Number(value);
  hips.position[axis] = base.position[axis] + actor.rootPosition[axis];
}

function resetBone(jointId, actor = getActiveActor()) {
  const bone = getBone(jointId, actor);
  if (!actor || !bone) return;
  const key = normalizeBoneName(bone.name);
  const state = actor.initialStates.get(key);
  if (!state) return;
  bone.quaternion.copy(state.quaternion);
  actor.rotations.set(key, { x: 0, y: 0, z: 0 });
}

function resetCategory(category, actor = getActiveActor()) {
  (category === "upper" ? upperJointIds : lowerJointIds).forEach((jointId) => resetBone(jointId, actor));
  if (category !== "lower" || !actor) return;
  const hips = getBone("Hips", actor);
  const base = hips && actor.initialStates.get(normalizeBoneName(hips.name));
  if (hips && base) hips.position.copy(base.position);
  actor.rootPosition.x = 0; actor.rootPosition.y = 0; actor.rootPosition.z = 0;
}

function resetAll({ actor = getActiveActor(), silent = false } = {}) {
  if (!actor) return;
  actor.initialStates.forEach((state, key) => {
    const bone = actor.bones.get(key);
    if (!bone) return;
    bone.quaternion.copy(state.quaternion);
    bone.position.copy(state.position);
    actor.rotations.set(key, { x: 0, y: 0, z: 0 });
  });
  actor.rootPosition.x = 0; actor.rootPosition.y = 0; actor.rootPosition.z = 0;
  actor.activePresets = { upper: null, lower: null, full: null };
  if (actor.id === activeActorId) {
    updatePresetHighlight();
    if (currentJoint) selectJoint(currentJoint);
    ui.presetDescription.textContent = "선택 인물을 T포즈로 초기화했습니다.";
  }
  if (!silent) setStatus(`${actor.name}의 모든 관절을 T포즈로 초기화했습니다.`);
}

function resetCurrentJoint() {
  const actor = getActiveActor();
  if (!actor || !currentJoint) return;
  resetBone(currentJoint, actor);
  if (currentJoint === "Hips") {
    const hips = getBone("Hips", actor);
    const state = hips && actor.initialStates.get(normalizeBoneName(hips.name));
    if (hips && state) hips.position.copy(state.position);
    actor.rootPosition.x = 0; actor.rootPosition.y = 0; actor.rootPosition.z = 0;
  }
  selectJoint(currentJoint);
  markCustomPose(actor);
  setStatus(`${actor.name}의 ${ui.jointEditorTitle.textContent} 관절을 초기화했습니다.`);
}

function findPreset(category, poseId) { return poseLibrary[category]?.find((pose) => pose.id === poseId) || null; }

function applyPreset(category, poseId, { actor = getActiveActor(), silent = false, fit = true } = {}) {
  const pose = findPreset(category, poseId);
  if (!pose || !actor) return;
  if (category === "full") {
    resetAll({ actor, silent: true });
    actor.activePresets = { upper: null, lower: null, full: poseId };
  } else {
    resetCategory(category, actor);
    actor.activePresets[category] = poseId;
    actor.activePresets.full = null;
  }
  Object.entries(pose.root || {}).forEach(([axis, value]) => setRootPosition(axis, value, actor));
  Object.entries(pose.joints || {}).forEach(([jointId, values]) => {
    Object.entries(values).forEach(([axis, value]) => setJointRotation(jointId, axis, value, actor));
  });
  if (actor.id === activeActorId) {
    updatePresetHighlight();
    ui.presetDescription.textContent = pose.description;
    if (currentJoint) selectJoint(currentJoint);
  }
  if (fit) requestAnimationFrame(() => fitCameraToActors({ announce: false }));
  if (!silent) setStatus(`${actor.name} · ${category === "upper" ? "상체" : category === "lower" ? "하체" : "전신"} 프리셋: ${pose.name}`);
}

function markCustomPose(actor = getActiveActor()) {
  if (!actor) return;
  actor.activePresets = { upper: null, lower: null, full: null };
  if (actor.id === activeActorId) {
    updatePresetHighlight();
    ui.presetDescription.textContent = `${actor.name}의 포즈를 수동으로 다듬는 중입니다.`;
  }
}

function updatePresetHighlight() {
  const active = getActiveActor()?.activePresets || {};
  document.querySelectorAll(".preset-button").forEach((button) => {
    button.classList.toggle("active", active[button.dataset.category] === button.dataset.poseId);
  });
}

function allCanonicalJointIds() { return [...new Set([...upperJointIds, ...lowerJointIds])]; }

function serializePose(actor = getActiveActor()) {
  if (!actor) return null;
  const joints = {};
  allCanonicalJointIds().forEach((jointId) => {
    const bone = getBone(jointId, actor);
    if (!bone) return;
    const values = actor.rotations.get(normalizeBoneName(bone.name));
    if (values && (values.x || values.y || values.z)) joints[jointId] = { ...values };
  });
  return { format: "pose-master-v3", root: { ...actor.rootPosition }, joints };
}

function applyPoseData(data, actor = getActiveActor()) {
  if (!actor || !data || typeof data !== "object") return false;
  resetAll({ actor, silent: true });
  Object.entries(data.root || {}).forEach(([axis, value]) => {
    if (["x", "y", "z"].includes(axis) && Number.isFinite(Number(value))) setRootPosition(axis, Number(value), actor);
  });
  Object.entries(data.joints || {}).forEach(([jointId, values]) => {
    Object.entries(values || {}).forEach(([axis, value]) => {
      if (["x", "y", "z"].includes(axis) && Number.isFinite(Number(value))) setJointRotation(jointId, axis, Number(value), actor);
    });
  });
  markCustomPose(actor);
  if (actor.id === activeActorId && currentJoint) selectJoint(currentJoint);
  requestAnimationFrame(() => fitCameraToActors({ announce: false }));
  return true;
}

function readSavedPoses() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(current)) return current;
    return [];
  } catch (error) { console.warn(error); return []; }
}

function writeSavedPoses(poses) { localStorage.setItem(STORAGE_KEY, JSON.stringify(poses)); }

function syncSavedPoseEditor() {
  const isEditing = Boolean(editingSavedPoseId);
  ui.savePose.textContent = isEditing ? "덮어쓰기" : "저장";
  ui.cancelPoseEdit.hidden = !isEditing;
}

function resetSavedPoseEditor() {
  editingSavedPoseId = null;
  if (!ui.poseNameInput) return;
  ui.poseNameInput.value = "";
  syncSavedPoseEditor();
  renderSavedPoses();
}

function saveCurrentPose() {
  const actor = getActiveActor();
  const name = ui.poseNameInput.value.trim();
  if (!actor) return;
  if (!name) { setStatus("저장할 포즈 이름을 입력해 주세요.", true); ui.poseNameInput.focus(); return; }
  const poses = readSavedPoses();
  if (editingSavedPoseId) {
    const index = poses.findIndex((item) => item.id === editingSavedPoseId);
    if (index >= 0) {
      const updated = { ...poses[index], name, pose: serializePose(actor), updatedAt: new Date().toISOString() };
      poses.splice(index, 1);
      poses.unshift(updated);
      writeSavedPoses(poses);
      ui.poseNameInput.value = name;
      syncSavedPoseEditor();
      renderSavedPoses();
      setStatus(`${actor.name}의 수정된 포즈를 ‘${name}’에 덮어썼습니다.`);
      return;
    }
    editingSavedPoseId = null;
  }
  poses.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, pose: serializePose(actor) });
  writeSavedPoses(poses.slice(0, 30));
  resetSavedPoseEditor();
  setStatus(`${actor.name}의 사용자 포즈 저장: ${name}`);
}

function loadSavedPose(item) {
  const actor = getActiveActor();
  if (!actor) return;
  applyPoseData(item.pose, actor);
  editingSavedPoseId = item.id;
  ui.poseNameInput.value = item.name;
  syncSavedPoseEditor();
  renderSavedPoses();
  setStatus(`${actor.name}에 ‘${item.name}’을 불러왔습니다. 수정 후 덮어쓸 수 있습니다.`);
}

function deleteSavedPose(id) {
  const poses = readSavedPoses();
  const target = poses.find((item) => item.id === id);
  writeSavedPoses(poses.filter((item) => item.id !== id));
  if (editingSavedPoseId === id) resetSavedPoseEditor();
  else renderSavedPoses();
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
    row.className = `saved-pose-item${item.id === editingSavedPoseId ? " editing" : ""}`;
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
  const actor = getActiveActor();
  if (!actor) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(serializePose(actor), null, 2));
    setStatus(`${actor.name}의 포즈 JSON을 클립보드에 복사했습니다.`);
  } catch (error) { console.error(error); setStatus("클립보드 복사 권한을 허용해 주세요.", true); }
}

function makeSnapshotFilename() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `pose-master-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;
}

function captureSnapshot() {
  if (!renderer || !scene || !camera || !actors.length) return;
  try {
    const ringWasVisible = selectionRing.visible;
    selectionRing.visible = false;
    renderer.render(scene, camera);
    snapshotDataUrl = renderer.domElement.toDataURL("image/png");
    snapshotFilename = makeSnapshotFilename();
    selectionRing.visible = ringWasVisible;
    renderer.render(scene, camera);
    ui.snapshotPreview.src = snapshotDataUrl;
    ui.snapshotDialog.hidden = false;
    ui.snapshotClose.focus();
    setStatus("현재 3D 장면의 스냅샷을 만들었습니다.");
  } catch (error) {
    console.error(error);
    selectionRing.visible = Boolean(getActiveActor());
    setStatus("스냅샷을 만들지 못했습니다.", true);
  }
}

function downloadSnapshot() {
  if (!snapshotDataUrl) return;
  const link = document.createElement("a");
  link.href = snapshotDataUrl;
  link.download = snapshotFilename || makeSnapshotFilename();
  document.body.append(link);
  link.click();
  link.remove();
  setStatus("PNG 스냅샷 다운로드를 시작했습니다.");
}

async function shareSnapshot() {
  if (!snapshotDataUrl) return;
  try {
    const blob = await (await fetch(snapshotDataUrl)).blob();
    const file = new File([blob], snapshotFilename || makeSnapshotFilename(), { type: "image/png" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title: "Pose Master 스냅샷", files: [file] });
      setStatus("스냅샷 공유·저장을 완료했습니다.");
      return;
    }
    downloadSnapshot();
  } catch (error) {
    if (error?.name === "AbortError") { setStatus("스냅샷 공유를 취소했습니다."); return; }
    console.error(error);
    downloadSnapshot();
  }
}

function closeSnapshot() {
  ui.snapshotDialog.hidden = true;
  ui.snapshotPreview.removeAttribute("src");
  snapshotDataUrl = null;
  snapshotFilename = null;
  ui.captureSnapshot.focus();
}

function setActivePanel(panelId) {
  document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== panelId; });
  ui.panelTabs.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === panelId);
  });
}

function bindEvents() {
  ui.regionSelect.addEventListener("change", () => updateGroupOptions());
  ui.groupSelect.addEventListener("change", updateJointOptions);
  ui.jointSelect.addEventListener("change", () => selectJoint(ui.jointSelect.value));
  ui.resetPose.addEventListener("click", () => resetAll());
  ui.resetJoint.addEventListener("click", resetCurrentJoint);
  ui.copyPose.addEventListener("click", copyPoseJson);
  ui.savePose.addEventListener("click", saveCurrentPose);
  ui.cancelPoseEdit.addEventListener("click", () => {
    resetSavedPoseEditor();
    setStatus("새 포즈 저장 모드로 전환했습니다.");
    ui.poseNameInput.focus();
  });
  ui.poseNameInput.addEventListener("keydown", (event) => { if (event.key === "Enter") saveCurrentPose(); });
  ui.addActor.addEventListener("click", addActor);
  ui.fitAllActors.addEventListener("click", () => fitCameraToActors());
  ui.panelTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) setActivePanel(button.dataset.tab);
  });
  ui.cameraReset.addEventListener("click", resetCamera);
  ui.zoomIn.addEventListener("click", () => zoomCamera(0.8));
  ui.zoomOut.addEventListener("click", () => zoomCamera(1.25));
  ui.cameraLeft.addEventListener("click", () => panCameraScreen(-1, 0));
  ui.cameraRight.addEventListener("click", () => panCameraScreen(1, 0));
  ui.cameraUp.addEventListener("click", () => panCameraScreen(0, 1));
  ui.cameraDown.addEventListener("click", () => panCameraScreen(0, -1));
  ui.captureSnapshot.addEventListener("click", captureSnapshot);
  ui.snapshotDownload.addEventListener("click", downloadSnapshot);
  ui.snapshotShare.addEventListener("click", shareSnapshot);
  ui.snapshotClose.addEventListener("click", closeSnapshot);
  ui.snapshotDialog.addEventListener("click", (event) => { if (event.target === ui.snapshotDialog) closeSnapshot(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.snapshotDialog.hidden) closeSnapshot();
  });
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
  setActivePanel("presets");
  initScene();
}

window.addEventListener("DOMContentLoaded", init);
