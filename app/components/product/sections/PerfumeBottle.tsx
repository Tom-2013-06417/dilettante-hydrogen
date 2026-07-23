/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {useMemo} from 'react';
import * as THREE from 'three';
import {tierLabelSide} from './cubeAnchors';
import {
  BlueprintRim,
  RevolvedBlueprintOutline,
} from './CylinderBlueprintOutline';

/** Flat unlit fill — matches cube / page (vellum-100) */
const FILL = '#fff6e6';
const EDGE = '#152015'; // inkwell-700

/**
 * Cel-shaded glossy black — hard-edged white specular “cutout”
 * (anime / cell-shaded highlight, not a soft blur).
 */
const CAP_CEL_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const CAP_CEL_FRAG = /* glsl */ `
uniform vec3 uLightDir;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vViewDir);
  vec3 l = normalize(uLightDir);
  vec3 h = normalize(l + v);

  float ndotl = max(dot(n, l), 0.0);
  float ndoth = max(dot(n, h), 0.0);
  float fresnel = 1.0 - max(dot(n, v), 0.0);

  // Hard bands — white highlight reads as a flat graphic shape
  float shade = step(0.55, ndotl) * 0.06;
  float gloss = step(0.9, ndoth);
  float rim = step(0.75, fresnel) * 0.06;

  vec3 black = vec3(0.035);
  vec3 white = vec3(1.0);
  vec3 color = black + (shade + rim + gloss * white) * uIntensity;
  gl_FragColor = vec4(color, 1.0);
}
`;

/** Where the foot taper reaches full radius / shoulder taper begins */
const FOOT_TAPER_END = 0.1;
/** Late start = shorter shoulder = tighter “border-radius” */
const SHOULDER_TAPER_START = 0.9;
/** Cap top recess radius as a fraction of cap radius */
const CAP_RECESS_R = 0.9;

export function bottleDimsForCube(cubeSize: number) {
  // Glass and cap heights are independent — glass taller than the cap.
  const bodyHeight = cubeSize * 0.4;
  const capHeight = cubeSize * 0.3;
  const height = bodyHeight + capHeight;
  const bodyRadius = cubeSize * 0.3;
  return {height, bodyHeight, capHeight, bodyRadius};
}

/**
 * Glass body profile: straight-ish foot taper from the base up to 10%
 * height, full cylinder, then a tight shoulder into the neck.
 */
function buildBodyProfile(
  bodyR: number,
  neckR: number,
  baseR: number,
  yBottom: number,
  yTop: number,
): {r: number; y: number}[] {
  const h = yTop - yBottom;
  return [
    // Foot — mostly straight taper, starts resolving at 10% height
    {r: baseR, y: yBottom},
    {r: bodyR, y: yBottom + h * FOOT_TAPER_END},
    // Straight wall
    {r: bodyR, y: yBottom + h * SHOULDER_TAPER_START},
    // Tight shoulder (low border-radius) into neck
    {r: bodyR * 0.82, y: yBottom + h * 0.95},
    {r: neckR, y: yTop},
  ];
}

/**
 * Cap profile in local space (origin at cap center): straight wall, then an
 * elevated curved rim groove and a slight circular top recess at 90% radius.
 *
 * `outlineProfile` stops at the recess rim — closing to r≈0 would draw a
 * diameter through the silhouette generators.
 */
function buildCapProfile(capR: number, capH: number) {
  const yBottom = -capH / 2;
  const yTop = capH / 2;
  const lipRise = capH * 0.045;
  const grooveDepth = capH * 0.028;
  const recessDepth = capH * 0.01;
  const recessR = capR * CAP_RECESS_R;
  const yLip = yTop + lipRise * 0.15;
  const yGroove = yTop - grooveDepth;
  const yDeck = yTop - lipRise * 0.35;
  const yRecess = yDeck - recessDepth;

  const outlineProfile = [
    // Underside + outer wall
    {r: capR * 0.98, y: yBottom},
    {r: capR, y: yBottom},
    {r: capR, y: yTop - lipRise * 0.5},
    // Elevated rim lip
    {r: capR, y: yLip},
    // Curved groove just inside the lip
    {r: capR * 0.985, y: yLip - grooveDepth * 0.25},
    {r: capR * 0.96, y: yGroove},
    {r: capR * 0.935, y: yGroove + grooveDepth * 0.35},
    {r: capR * 0.915, y: yDeck},
    // Deck to recess edge
    {r: recessR, y: yDeck},
    // Recess wall — stop here for outlines
    {r: recessR, y: yRecess},
  ];

  const profile = [...outlineProfile, {r: 0.001, y: yRecess}];

  return {profile, outlineProfile, recessR, yDeck, yRecess, yLip};
}

export type PerfumeBottleProps = {
  bodyHeight: number;
  capHeight: number;
  bodyRadius: number;
  /** Attach point for heart-note leader (local −X on the body). */
  onAnchorRef?: (node: THREE.Object3D | null) => void;
};

/**
 * Perfume bottle stand-in: lathed glass body + detailed cap.
 * Cap radius is 98% of the body. Blueprint silhouettes track the camera.
 */
export function PerfumeBottle({
  bodyHeight,
  capHeight,
  bodyRadius,
  onAnchorRef,
}: PerfumeBottleProps) {
  const height = bodyHeight + capHeight;
  const neckR = bodyRadius * 0.52;
  const baseR = bodyRadius * 0.75;
  const capR = bodyRadius * 0.98;
  const yBottom = -height / 2;
  const yBodyTop = yBottom + bodyHeight;
  const yCapCenter = yBodyTop + capHeight / 2;
  const yFootTaperEnd = yBottom + bodyHeight * FOOT_TAPER_END;
  const yShoulderTaperStart = yBottom + bodyHeight * SHOULDER_TAPER_START;

  const profile = useMemo(
    () => buildBodyProfile(bodyRadius, neckR, baseR, yBottom, yBodyTop),
    [baseR, bodyRadius, neckR, yBottom, yBodyTop],
  );

  const lathePoints = useMemo(
    () => profile.map((p) => new THREE.Vector2(p.r, p.y)),
    [profile],
  );

  const {
    profile: capProfile,
    outlineProfile: capOutlineProfile,
    recessR,
    yDeck: yDeckLocal,
    yRecess: yRecessLocal,
    yLip: yLipLocal,
  } = useMemo(() => buildCapProfile(capR, capHeight), [capHeight, capR]);

  const capLathePoints = useMemo(
    () => capProfile.map((p) => new THREE.Vector2(p.r, p.y)),
    [capProfile],
  );

  const side = tierLabelSide('heart');
  const capUniforms = useMemo(() => {
    // ~45° off the camera axis (view +Z) — classic key from upper-right
    const angle = Math.PI / 4;
    const lightDir = new THREE.Vector3(
      Math.sin(angle),
      Math.sin(angle) * 0.55,
      Math.cos(angle),
    ).normalize();
    return {
      uLightDir: {value: lightDir},
      uIntensity: {value: 0.65},
    };
  }, []);

  return (
    <group>
      {/* Glass body */}
      <mesh>
        <latheGeometry args={[lathePoints, 64]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>
      {/* Closed bottle floor */}
      <mesh position={[0, yBottom + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[baseR, 32]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>
      <RevolvedBlueprintOutline profile={profile} color={EDGE} />
      {/* Rings where foot / shoulder tapers begin */}
      <BlueprintRim radius={bodyRadius} y={yFootTaperEnd} color={EDGE} />
      <BlueprintRim radius={bodyRadius} y={yShoulderTaperStart} color={EDGE} />

      {/* Cap — cel-shaded black with hard white gloss cutout */}
      <group position={[0, yCapCenter, 0]}>
        <mesh>
          <latheGeometry args={[capLathePoints, 64]} />
          <shaderMaterial
            toneMapped={false}
            uniforms={capUniforms}
            vertexShader={CAP_CEL_VERT}
            fragmentShader={CAP_CEL_FRAG}
          />
        </mesh>
        <RevolvedBlueprintOutline profile={capOutlineProfile} color={EDGE} />
        {/* Full top circles so the back half of the cap still reads */}
        <BlueprintRim radius={capR} y={yLipLocal} color={EDGE} mode="full" />
        <BlueprintRim
          radius={recessR}
          y={yDeckLocal + 0.002}
          color={EDGE}
          mode="full"
        />
        <BlueprintRim
          radius={recessR}
          y={yRecessLocal - 0.001}
          color={EDGE}
          mode="full"
        />
      </group>

      {/* Heart-note anchor on the body midline */}
      <group
        ref={onAnchorRef}
        position={[
          -bodyRadius,
          yBottom + bodyHeight * 0.4,
          side === 'left' ? bodyRadius * 0.55 : bodyRadius * 0.3,
        ]}
      />
    </group>
  );
}
/* eslint-enable react/no-unknown-property */
