import * as THREE from 'three';
import {
	scaleSequentialLog
  } from 'd3-scale';
import {
	interpolateMagma
} from 'd3-scale-chromatic';


export default function applyStyle(scene,styleParams){
	let maincolor = null;
	if (styleParams.color != null) {
		maincolor = new THREE.Color(styleParams.color);
	}
	scene.traverse(child => {
			if (child instanceof THREE.Mesh) {

				if (styleParams.color != null) {
					child.material.color = maincolor;
				}
				if (styleParams.opacity != null) {
					child.material.opacity = styleParams.opacity;
					child.material.transparent = styleParams.opacity < 1.0 ? true : false;
				}
				
				// some gltf has wrong bounding data, recompute here
				child.geometry.computeBoundingBox();
				child.geometry.computeBoundingSphere();
				child.castShadow = true;

				//For changing individual colors later, we have to introduce vertexcolors
				//const color = new THREE.Color();
				const count = child.geometry.attributes.position.count;
				const positions = child.geometry.attributes.position;
				child.geometry.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( count * 3 ), 3 ) );
				const colors = child.geometry.attributes.color;
				
				const ymin = child.geometry.boundingBox.min.y;
				const ymax = child.geometry.boundingBox.max.y;
				const ydiff = ymax - ymin;
				let magnitude = scaleSequentialLog(interpolateMagma).domain([1800, 2020])
				const colormap = child.parent.userData.attr.map(magnitude);
				//Create a little gradient from black to white
				//adding 0.3 not to start at black, dividing by 10 limits effect to bottom
				for ( let i = 0; i < count; i ++ ) {
					let batchid = child.geometry.attributes._batchid.getX(i);
					let colorval = colormap[batchid];
					let color = new THREE.Color(colorval);
					//color.setRGB(colorval);
					let greyval = Math.min( 0.6 + ( positions.getY( i ) + Math.abs( ymin )) / 3, 1 );
					color.lerp ( new THREE.Color("rgb(20,20,20)"), 1-greyval );
					//color.setRGB(greyval, greyval, greyval);
					colors.setXYZ( i, color.r, color.g, color.b );
				}
				child.material.vertexColors = true;
				child.material.depthWrite = !child.material.transparent; // necessary for Velsen dataset?
				
			}
		});
		/*
		if (styleParams.color != null || styleParams.opacity != null) {
			let color = new THREE.Color(styleParams.color);
			scene.traverse(child => {
				if (child instanceof THREE.Mesh) {
					if (styleParams.color != null) 
						child.material.color = color;
						
					if (styleParams.opacity != null) {
						child.material.opacity = styleParams.opacity;
						child.material.transparent = styleParams.opacity < 1.0 ? true : false;
					}
				}
			});
		}*/
		if (styleParams.debugColor) {
			scene.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.material.color = styleParams.debugColor;
				}
			})
		}
		return scene;
	}
