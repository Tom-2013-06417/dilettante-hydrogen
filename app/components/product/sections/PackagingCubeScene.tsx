/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {useFrame, useThree} from '@react-three/fiber';
import {useEffect, useMemo, useRef, type MutableRefObject} from 'react';
import * as THREE from 'three';
import type {ScentTier, ScentTierId} from '~/lib/scentProfile';
import {
  tierLabelSide,
  type CubeAnchorPoint,
  type CubeAnchorsMap,
} from './cubeAnchors';
import {CylinderBlueprintOutline} from './CylinderBlueprintOutline';
import {HandDrawnBoxEdges} from './HandDrawnBoxEdges';
import {bottleDimsForCube, PerfumeBottle} from './PerfumeBottle';
import {
  canvasesToHalfTextures,
  type ProductHalfCanvases,
} from './productHalfCrops';
import {createHatchTamMaps, type HatchTamMaps} from './hatchTam';

const SIZE = 1.2;
const HALF_H = SIZE / 2;
/** Assembled Y centers for the top / base halves */
const TOP_STACK_Y = HALF_H / 2;
const BASE_STACK_Y = -HALF_H / 2;

const {
  height: BOTTLE_H,
  bodyHeight: BOTTLE_BODY_H,
  capHeight: BOTTLE_CAP_H,
  bodyRadius: BOTTLE_R,
} = bottleDimsForCube(SIZE);
/**
 * Blind well in the base half: fits the bottle diameter, stops at the
 * half's mid-plane (does not punch through the bottom face).
 */
const HOLE_R = BOTTLE_R * 1.04;
const HOLE_DEPTH = HALF_H / 2;
/**
 * Air above/below the bottle when fully exploded. Inner faces of the
 * halves sit at ±(BOTTLE_H/2 + clearance), so the full bottle reads clear.
 */
const EXPLODE_CLEARANCE = 0.36;
const HALF_GAP = BOTTLE_H / 2 + EXPLODE_CLEARANCE;
const TOP_EXPLODE_Y = HALF_GAP;
const BASE_EXPLODE_Y = -HALF_GAP;

const FILL = '#fff6e6'; // vellum-100
const EDGE = '#152015'; // inkwell-700
const HATCH_FILL = '#152015'; // inkwell-700
const HATCH_STROKE = '#fff6e6'; // vellum-100
const HATCH_EDGE = '#fff6e6'; // vellum-100

/** Screen-space TAM hatch (Halladay-style nested tones + camera spotlight). */
const HATCH_TAM_SCALE = 160;
const HATCH_WOBBLE = 0.004;
const HATCH_SPOT_INNER_DEG = 0.5;
const HATCH_SPOT_OUTER_DEG = 14;
const HATCH_SPOT_ABOVE = 1.1;
const HATCH_SPOT_AIM = new THREE.Vector3(0, SIZE / 2, 0);

const HATCH_VERT = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const HATCH_FRAG = /* glsl */ `
uniform vec3 uFill;
uniform vec3 uInk;
uniform vec3 uSpotPos;
uniform vec3 uSpotDir;
uniform float uSpotInner;
uniform float uSpotOuter;
uniform sampler2D uHatch0;
uniform sampler2D uHatch1;
uniform float uTamScale;
uniform float uWobble;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

/** intensity 1 = sparse/blank, 0 = dense; returns paper luminance. */
float hatching(vec2 uv, float intensity) {
  vec3 hatch0 = texture2D(uHatch0, uv).rgb;
  vec3 hatch1 = texture2D(uHatch1, uv).rgb;

  float overbright = max(0.0, intensity - 1.0);
  float i = intensity * 6.0;
  vec3 weightsA = clamp(vec3(i) - vec3(0.0, 1.0, 2.0), 0.0, 1.0);
  vec3 weightsB = clamp(vec3(i) - vec3(3.0, 4.0, 5.0), 0.0, 1.0);

  weightsA.xy -= weightsA.yz;
  weightsA.z -= weightsB.x;
  weightsB.xy -= weightsB.yz;

  hatch0 *= weightsA;
  hatch1 *= weightsB;

  return overbright + hatch0.r + hatch0.g + hatch0.b + hatch1.r + hatch1.g + hatch1.b;
}

void main() {
  vec3 nWorld = normalize(vWorldNormal);
  if (!gl_FrontFacing) nWorld = -nWorld;

  vec3 toFrag = vWorldPos - uSpotPos;
  float spot = smoothstep(
    uSpotOuter,
    uSpotInner,
    dot(normalize(toFrag), normalize(uSpotDir))
  );
  vec3 L = normalize(-toFrag);
  float facing = smoothstep(0.0, 0.35, clamp(dot(nWorld, L), 0.0, 1.0));
  float lit = spot * facing;

  vec2 uv = gl_FragCoord.xy / max(uTamScale, 1.0);
  float wob =
    valueNoise(uv * 6.0) * 2.0 - 1.0 +
    (valueNoise(uv * 14.0 + 17.0) * 2.0 - 1.0) * 0.5;
  uv += wob * uWobble;

  float intensity = mix(0.66, 0.80, smoothstep(0.0, 0.95, lit));
  float paper = clamp(hatching(uv, intensity), 0.0, 1.0);
  float blank = smoothstep(0.88, 1.0, lit);
  paper = mix(paper, 1.0, blank * 0.3);
  float mask = smoothstep(0.40, 0.55, 1.0 - paper);

  vec3 color = mix(uFill, uInk, mask);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

function createHatchMaterial(tam: HatchTamMaps) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFill: {value: new THREE.Color(HATCH_FILL)},
      uInk: {value: new THREE.Color(HATCH_STROKE)},
      uSpotPos: {value: new THREE.Vector3()},
      uSpotDir: {value: new THREE.Vector3(0, 0, -1)},
      uSpotInner: {
        value: Math.cos(THREE.MathUtils.degToRad(HATCH_SPOT_INNER_DEG)),
      },
      uSpotOuter: {
        value: Math.cos(THREE.MathUtils.degToRad(HATCH_SPOT_OUTER_DEG)),
      },
      uHatch0: {value: tam.hatch0},
      uHatch1: {value: tam.hatch1},
      uTamScale: {value: HATCH_TAM_SCALE},
      uWobble: {value: HATCH_WOBBLE},
    },
    vertexShader: HATCH_VERT,
    fragmentShader: HATCH_FRAG,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

let sharedTam: HatchTamMaps | null = null;

function getSharedTamMaps(): HatchTamMaps {
  if (!sharedTam) sharedTam = createHatchTamMaps();
  return sharedTam;
}

function useHatchMaterial() {
  const material = useMemo(() => createHatchMaterial(getSharedTamMaps()), []);
  const {camera} = useThree();
  const spotUp = useRef(new THREE.Vector3());

  useFrame(() => {
    const pos = material.uniforms.uSpotPos.value as THREE.Vector3;
    const dir = material.uniforms.uSpotDir.value as THREE.Vector3;
    camera.getWorldPosition(pos);
    spotUp.current.set(0, 1, 0).transformDirection(camera.matrixWorld);
    pos.addScaledVector(spotUp.current, HATCH_SPOT_ABOVE);
    dir.copy(HATCH_SPOT_AIM).sub(pos).normalize();
  });

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);
  return material;
}

type PackagingCubeSceneProps = {
  /** Pre-baked product image half-crops (loaded outside R3F). */
  halfCanvases: ProductHalfCanvases | null;
  tiers: [ScentTier, ScentTier, ScentTier];
  /** 0 = stacked halves / solid cube, 1 = fully exploded (read in useFrame) */
  explodeAmountRef: MutableRefObject<number>;
  /** Solid packaging cube (assembled) */
  showSolid: boolean;
  /** Halves + bottle (replaces solid when splitting) */
  showLayers: boolean;
  /** Y rotation in radians (read in useFrame) */
  scrollRotationYRef: MutableRefObject<number>;
  /**
   * Element that owns the SVG/label overlay. Anchor coords are reported
   * relative to this element's bounding box.
   */
  stageElement: HTMLElement | null;
  onAnchorsChange: (anchors: CubeAnchorsMap) => void;
};

type AnchorRefs = MutableRefObject<
  Partial<Record<ScentTierId, THREE.Object3D | null>>
>;

/** Cream stand-in while photo faces load — avoids a dark half-cube flash. */
function PlaceholderSidePlanes({half}: {half: number}) {
  return (
    <>
      <mesh position={[0, 0, half + 0.002]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -half - 0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>
      <mesh position={[half + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>
      <mesh position={[-half - 0.002, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>
    </>
  );
}

function PhotoSidePlanes({
  halfCanvases,
  half,
}: {
  halfCanvases: ProductHalfCanvases;
  half: number;
}) {
  const crops = useMemo(
    () => canvasesToHalfTextures(halfCanvases),
    [halfCanvases],
  );

  useEffect(() => {
    return () => {
      crops.topCrop.dispose();
      crops.bottomCrop.dispose();
    };
  }, [crops]);

  return (
    <>
      <mesh position={[0, 0, half + 0.002]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.topCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[0, 0, -half - 0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.topCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[half + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.bottomCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[-half - 0.002, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.bottomCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </>
  );
}

function OutlineBox({
  args,
  visible = true,
}: {
  args: [number, number, number];
  visible?: boolean;
}) {
  return (
    <group visible={visible}>
      <mesh>
        <boxGeometry args={args} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>
      <HandDrawnBoxEdges args={args} color={EDGE} />
    </group>
  );
}

/** Top half with screen-space hatch + hand-inked edges. */
function HalftoneOutlineBox({args}: {args: [number, number, number]}) {
  const material = useHatchMaterial();

  return (
    <group>
      <mesh material={material}>
        <boxGeometry args={args} />
      </mesh>
      <HandDrawnBoxEdges args={args} color={HATCH_EDGE} />
    </group>
  );
}

/**
 * Base half: plain fill collar/well + product-photo sides.
 * (Hatching on the base is off for now.)
 */
function BaseHalfBody({
  halfCanvases,
}: {
  halfCanvases: ProductHalfCanvases | null;
}) {
  const collarGeo = useMemo(() => {
    const half = SIZE / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-half, -half);
    shape.lineTo(half, -half);
    shape.lineTo(half, half);
    shape.lineTo(-half, half);
    shape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, HOLE_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: HOLE_DEPTH,
      bevelEnabled: false,
      curveSegments: 32,
    });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, HALF_H / 2, 0);
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      collarGeo.dispose();
    };
  }, [collarGeo]);

  const holeFloorY = HALF_H / 2 - HOLE_DEPTH;
  const half = SIZE / 2;
  const floorClearance = 0.006;
  const lowerTopY = holeFloorY - floorClearance;
  const lowerBottomY = -HALF_H / 2;
  const lowerBoxH = Math.max(0.01, lowerTopY - lowerBottomY);
  const lowerCenterY = (lowerTopY + lowerBottomY) / 2;

  return (
    <group>
      <mesh>
        <boxGeometry args={[SIZE, HALF_H, SIZE]} />
        <meshBasicMaterial
          color={FILL}
          toneMapped={false}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <HandDrawnBoxEdges args={[SIZE, HALF_H, SIZE]} color={EDGE} />

      <mesh position={[0, lowerCenterY, 0]}>
        <boxGeometry args={[SIZE * 0.998, lowerBoxH, SIZE * 0.998]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>

      <mesh geometry={collarGeo}>
        <meshBasicMaterial
          color={FILL}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, holeFloorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[HOLE_R, 48]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>

      {halfCanvases ? (
        <PhotoSidePlanes halfCanvases={halfCanvases} half={half} />
      ) : (
        <PlaceholderSidePlanes half={half} />
      )}

      <group position={[0, HALF_H / 2 - HOLE_DEPTH / 2, 0]}>
        <CylinderBlueprintOutline
          radius={HOLE_R}
          height={HOLE_DEPTH}
          color={EDGE}
          rimMode="full"
          fit="inner"
        />
      </group>
    </group>
  );
}

function CubeHalf({
  tierId,
  stackY,
  explodeY,
  explodeAmountRef,
  anchorRefs,
  halfCanvases,
  withHole = false,
}: {
  tierId: ScentTierId;
  stackY: number;
  explodeY: number;
  explodeAmountRef: MutableRefObject<number>;
  anchorRefs: AnchorRefs;
  halfCanvases: ProductHalfCanvases | null;
  withHole?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const side = tierLabelSide(tierId);

  // Scrub Y directly from scroll — no lerp. Declarative position is omitted
  // so parent re-renders (annotations, etc.) can't snap halves back to stackY.
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(
      0,
      stackY + explodeY * explodeAmountRef.current,
      0,
    );
  }, -1);

  return (
    <group ref={groupRef} position={[0, stackY, 0]}>
      {withHole ? (
        <BaseHalfBody halfCanvases={halfCanvases} />
      ) : (
        <HalftoneOutlineBox args={[SIZE, HALF_H, SIZE]} />
      )}
      {/*
        Local −X face: with +Y (CCW) scroll spin, this side rotates into
        the camera, so attach points stay on the near side instead of
        riding the +Z face around to the back.
      */}
      <group
        ref={(node) => {
          anchorRefs.current[tierId] = node;
        }}
        position={[-SIZE * 0.5, 0, side === 'left' ? SIZE * 0.28 : SIZE * 0.12]}
      />
    </group>
  );
}

export function PackagingCubeScene({
  halfCanvases,
  tiers,
  explodeAmountRef,
  showSolid,
  showLayers,
  scrollRotationYRef,
  stageElement,
  onAnchorsChange,
}: PackagingCubeSceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const anchorRefs = useRef<
    Partial<Record<ScentTierId, THREE.Object3D | null>>
  >({});
  const projected = useRef(new THREE.Vector3());
  const {camera, size, gl} = useThree();

  useFrame(() => {
    if (!rootRef.current) return;

    const targetY = scrollRotationYRef.current;
    const targetX = 0.22 + targetY * 0.15;

    // 1:1 with scroll — lerp lagged and popped when explode re-renders caught up
    rootRef.current.rotation.set(targetX, targetY, 0);
  }, -2);

  useFrame(() => {
    if (!showLayers || !stageElement) return;

    const stageRect = stageElement.getBoundingClientRect();
    const canvasRect = gl.domElement.getBoundingClientRect();
    const next: CubeAnchorsMap = {top: null, heart: null, base: null};

    for (const tier of tiers) {
      const obj = anchorRefs.current[tier.id];
      if (!obj) continue;

      obj.getWorldPosition(projected.current);
      projected.current.project(camera);

      if (projected.current.z > 1) continue;

      const canvasX = (projected.current.x * 0.5 + 0.5) * size.width;
      const canvasY = (-projected.current.y * 0.5 + 0.5) * size.height;
      const point: CubeAnchorPoint = {
        id: tier.id,
        x: canvasRect.left - stageRect.left + canvasX,
        y: canvasRect.top - stageRect.top + canvasY,
        side: tierLabelSide(tier.id),
      };
      next[tier.id] = point;
    }

    onAnchorsChange(next);
  });

  return (
    <group ref={rootRef}>
      <OutlineBox args={[SIZE, SIZE, SIZE]} visible={showSolid} />

      {showLayers ? (
        <>
          <CubeHalf
            tierId="top"
            stackY={TOP_STACK_Y}
            explodeY={TOP_EXPLODE_Y}
            explodeAmountRef={explodeAmountRef}
            anchorRefs={anchorRefs}
            halfCanvases={halfCanvases}
          />
          <CubeHalf
            tierId="base"
            stackY={BASE_STACK_Y}
            explodeY={BASE_EXPLODE_Y}
            explodeAmountRef={explodeAmountRef}
            anchorRefs={anchorRefs}
            halfCanvases={halfCanvases}
            withHole
          />
          {/* After both halves so bottle fill/outlines aren’t painted over mid-explode */}
          <group renderOrder={1}>
            <PerfumeBottle
              bodyHeight={BOTTLE_BODY_H}
              capHeight={BOTTLE_CAP_H}
              bodyRadius={BOTTLE_R}
              onAnchorRef={(node) => {
                anchorRefs.current.heart = node;
              }}
            />
          </group>
        </>
      ) : null}
    </group>
  );
}
/* eslint-enable react/no-unknown-property */
