import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FileNode, VisualizationMode, RepositoryData } from '@/types/galaxy';
import * as d3Force from 'd3-force-3d';

interface CodeGalaxyProps {
  repositoryData: RepositoryData | null;
  mode: VisualizationMode;
  onFileClick: (node: FileNode) => void;
  resetTrigger: number;
}

export const LANGUAGE_COLORS: Record<string, number> = {
  javascript: 0xFFD700,    // Bright gold
  typescript: 0x4169E1,    // Royal blue
  python: 0x32CD32,        // Lime green
  java: 0xFF6347,          // Tomato red
  go: 0x00CED1,           // Dark turquoise
  rust: 0xFF8C00,         // Dark orange
  cpp: 0xFF1493,          // Deep pink
  c: 0x9370DB,            // Medium purple
  ruby: 0xDC143C,         // Crimson
  php: 0x9966CC,          // Amethyst
  swift: 0xFF7F50,        // Coral
  kotlin: 0xDA70D6,       // Orchid
  css: 0x9932CC,          // Dark orchid
  html: 0xFF4500,         // Orange red
  other: 0x48D1CC,        // Medium turquoise
};

const STAR_COLORS = [
  0xFF00FF,  // Magenta
  0x00FFFF,  // Cyan
  0xFFFF00,  // Yellow
  0xFF0080,  // Hot pink
  0x00FF80,  // Spring green
  0x8000FF,  // Electric purple
];

export function CodeGalaxy({ repositoryData, mode, onFileClick, resetTrigger }: CodeGalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const linksGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const starColorRef = useRef<number>(STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]);
  const initialCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const initialTargetRef = useRef<THREE.Vector3 | null>(null);

  const processedData = useMemo<RepositoryData | null>(() => {
    if (!repositoryData) return null;

    if (repositoryData.nodes.length === 0) {
      return {
        ...repositoryData,
        nodes: [],
        links: [],
      };
    }

    const centerNode = repositoryData.nodes.reduce<FileNode | null>((current, candidate) => {
      if (!current) return candidate;
      const currentImportance = current.importance ?? -Infinity;
      const candidateImportance = candidate.importance ?? -Infinity;
      return candidateImportance > currentImportance ? candidate : current;
    }, repositoryData.nodes[0] ?? null);

    const nodesWithStar = repositoryData.nodes.map((node) => ({
      ...node,
      isStar: centerNode ? node.id === centerNode.id : false,
    }));

    return {
      ...repositoryData,
      nodes: nodesWithStar,
    };
  }, [repositoryData]);

  useEffect(() => {
    if (!containerRef.current || !processedData || processedData.nodes.length === 0) return;

    // Clean up previous scene
    if (rendererRef.current) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      rendererRef.current.dispose();
      controlsRef.current?.dispose();
    }

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a10);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / Math.max(containerRef.current.clientHeight, 1),
      0.1,
      5000
    );
    camera.position.z = 500;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Store initial camera state for reset
    initialCameraPositionRef.current = camera.position.clone();
    initialTargetRef.current = controls.target.clone();

    // Add starfield background (reduced for clarity)
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.3,
      transparent: true,
      opacity: 0.2,
    });

    const starsVertices = [];
    for (let i = 0; i < 1500; i++) {
      const x = (Math.random() - 0.5) * 4000;
      const y = (Math.random() - 0.5) * 4000;
      const z = (Math.random() - 0.5) * 4000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00F0FF, 1, 2000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create nodes group
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);
    nodesGroupRef.current = nodesGroup;

    // Create links group
    const linksGroup = new THREE.Group();
    scene.add(linksGroup);
    linksGroupRef.current = linksGroup;

    // Setup D3 force simulation with star file pinned at center
    const starNode = processedData.nodes.find(n => n.isStar);
    
    const simulation = d3Force.forceSimulation(processedData.nodes as any)
      .force('charge', d3Force.forceManyBody().strength(-50))
      .force('center', d3Force.forceCenter(0, 0, 0))
      .force('collide', d3Force.forceCollide().radius(10));

    // Pin the star file at the center
    if (starNode) {
      starNode.fx = 0;
      starNode.fy = 0;
      starNode.fz = 0;
    }

    if (mode === 'dependency' && processedData.links.length > 0) {
      simulation.force('link', d3Force.forceLink(processedData.links)
        .id((d: any) => d.id)
        .distance(100)
        .strength(0.5)
      );
    }

    // Create node meshes with enhanced visibility and star file
    const nodeMeshes = new Map<string, THREE.Mesh>();
    processedData.nodes.forEach((node) => {
      const isStar = node.isStar;
      const size = isStar ? 15 : Math.max(Math.log(node.loc + 1) * 3, 4);
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const color = isStar ? starColorRef.current : (LANGUAGE_COLORS[node.language.toLowerCase()] || LANGUAGE_COLORS.other);
      
      const material = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: isStar ? 1.0 : 0.7,
        shininess: 100,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { node };
      nodesGroup.add(mesh);
      nodeMeshes.set(node.id, mesh);
      
      // Add glow effect for star file
      if (isStar) {
        const glowGeometry = new THREE.SphereGeometry(size * 1.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.3,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.userData = { isGlow: true };
        mesh.add(glow);
      }
    });

    // Create link lines
    const updateLinks = () => {
      linksGroup.clear();
      
      if (mode === 'dependency') {
        processedData.links.forEach((link) => {
          const sourceNode = processedData.nodes.find(n => n.id === link.source);
          const targetNode = processedData.nodes.find(n => n.id === link.target);
          
          if (sourceNode && targetNode) {
            const points = [
              new THREE.Vector3(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0),
              new THREE.Vector3(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0),
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: 0x00F0FF,
              opacity: 0.2,
              transparent: true,
            });
            
            const line = new THREE.Line(geometry, material);
            linksGroup.add(line);
          }
        });
      }
    };

    // Update node positions from simulation
    simulation.on('tick', () => {
      processedData.nodes.forEach((node) => {
        const mesh = nodeMeshes.get(node.id);
        if (mesh) {
          mesh.position.set(node.x || 0, node.y || 0, node.z || 0);
        }
      });
      
      updateLinks();
    });

    // Run simulation
    simulation.alpha(1).restart();
    
    // Stop simulation after a while
    setTimeout(() => simulation.stop(), 5000);

    // Raycaster for mouse interactions with tooltip
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject: THREE.Mesh | null = null;
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '8px 12px';
    tooltip.style.background = 'hsl(240 10% 8% / 0.95)';
    tooltip.style.border = '1px solid hsl(180 100% 50%)';
    tooltip.style.borderRadius = '6px';
    tooltip.style.color = 'hsl(180 100% 50%)';
    tooltip.style.fontSize = '12px';
    tooltip.style.fontFamily = 'monospace';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.boxShadow = '0 0 20px hsl(180 100% 50% / 0.5)';
    document.body.appendChild(tooltip);

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodesGroup.children);

      // Reset previous hover
      if (hoveredObject && hoveredObject.material instanceof THREE.MeshPhongMaterial) {
        const node = hoveredObject.userData.node as FileNode;
        hoveredObject.material.emissiveIntensity = node.isStar ? 1.0 : 0.7;
      }

      if (intersects.length > 0) {
        hoveredObject = intersects[0].object as THREE.Mesh;
        const node = hoveredObject.userData.node as FileNode;
        
        if (hoveredObject.material instanceof THREE.MeshPhongMaterial) {
          hoveredObject.material.emissiveIntensity = node.isStar ? 1.5 : 1.2;
        }
        
        // Show tooltip
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
        tooltip.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 4px;">
            ${node.isStar ? '⭐ ' : ''}${node.name}
          </div>
          <div style="font-size: 10px; color: hsl(180 50% 70%);">
            ${node.language} • ${node.loc} LOC${node.isStar ? ' • GALAXY STAR' : ''}
          </div>
        `;
        
        renderer.domElement.style.cursor = 'pointer';
      } else {
        hoveredObject = null;
        tooltip.style.display = 'none';
        renderer.domElement.style.cursor = 'default';
      }
    };

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodesGroup.children);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const node = mesh.userData.node as FileNode;
        onFileClick(node);
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      
      // Remove tooltip
      if (tooltip.parentElement) {
        document.body.removeChild(tooltip);
      }
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      simulation.stop();
      controls.dispose();
      renderer.dispose();
      
      if (containerRef.current && renderer.domElement.parentElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [processedData, mode, onFileClick]);

  useEffect(() => {
    if (!resetTrigger) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const initialCameraPosition = initialCameraPositionRef.current;
    const initialTarget = initialTargetRef.current;

    if (camera && controls && initialCameraPosition && initialTarget) {
      camera.position.copy(initialCameraPosition);
      controls.target.copy(initialTarget);
      controls.update();
    }
  }, [resetTrigger]);

  if (!repositoryData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="text-8xl animate-pulse-slow">🌌</div>
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Welcome to the Galaxy</h2>
            <p className="text-muted-foreground">Enter a GitHub repository URL above to begin</p>
          </div>
        </div>
      </div>
    );
  }

  if (!processedData || processedData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <div className="text-5xl">🔍</div>
          <p className="text-sm">No files match the current filters.</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}

// Export function to capture canvas as image
export function exportGalaxyAsImage(): string | null {
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;
  return canvas.toDataURL('image/png');
}
