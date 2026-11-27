import { Component, Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/basketball_court.glb';

function CourtModel() {
  const { scene } = useGLTF(MODEL_URL);
  const { model, position, scale } = useMemo(() => {
    const model = scene.clone(true);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 3.7 / Math.max(size.x, size.z);

    return {
      model,
      position: center.multiplyScalar(-scale),
      scale,
    };
  }, [scene]);

  return (
    <group position={position} scale={scale}>
      <primitive object={model} />
    </group>
  );
}

function PreviewMessage({ children }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-emerald-50/80">
      {children}
    </div>
  );
}

class ModelErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Unable to load the basketball court preview:', error);
  }

  render() {
    if (this.state.hasError) {
      return <PreviewMessage>3D court preview is unavailable</PreviewMessage>;
    }

    return this.props.children;
  }
}

export default function Hero3DModel() {
  return (
    <ModelErrorBoundary>
      <Canvas
        aria-label="Interactive 3D basketball court. Drag to rotate."
        camera={{ position: [0, 3.5, 4.8], fov: 36 }}
        dpr={[1, 1.5]}
        fallback={<PreviewMessage>3D court preview is unavailable</PreviewMessage>}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          gl.setClearAlpha(0);
          gl.domElement.style.backgroundColor = 'transparent';
          scene.background = null;
        }}
        style={{ backgroundColor: 'transparent', touchAction: 'none' }}
      >
        <hemisphereLight args={['#e8fff3', '#183a30', 1.4]} />
        <ambientLight color="#f0fff7" intensity={1.1} />
        <directionalLight color="#fff5df" intensity={2.2} position={[4, 7, 5]} />
        <directionalLight color="#9de9ca" intensity={1.1} position={[-5, 3, -4]} />
        <Suspense fallback={null}>
          <CourtModel />
          <ContactShadows
            blur={3}
            color="#52765b"
            far={1.1}
            opacity={0.14}
            position={[0, -0.21, 0]}
            resolution={256}
            scale={4.6}
          />
        </Suspense>
        <OrbitControls
          enableDamping
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={1.45}
          minPolarAngle={0.75}
          rotateSpeed={0.65}
          target={[0, 0, 0]}
        />
      </Canvas>
    </ModelErrorBoundary>
  );
}
