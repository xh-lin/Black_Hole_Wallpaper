/**
 * Reference(s):
 * Aerotwist - Creating Particles with Three.js
 * https://aerotwist.com/tutorials/creating-particles-with-three-js
 * Advanced: Web audio visualizer
 * https://steamcommunity.com/sharedfiles/filedetails/?id=786006047
 */


/* things for the audio visualizer */

// An array containing audio data for the left and right channels
// left channel: [0:63], right channel: [64:127]
// low frequencies are near the beginning, high ones at the end of the array
// containing 128 positive floats which may go beyond 1.0
let audio = [];
// this will be called by the audio listener to update the audio array
const listener = arr => {
  audio = arr;
}
// containing indices of disk particles for 128 audio buckets
let diskFrequencies = [];
for (let i = 0; i < 128; i++)
  diskFrequencies.push( [] );


// get color in between from color A to B
// colorA, colorB: THREE.Color
// alpha: a float from 0 to 1
colorBetween = function(colorA, colorB, alpha) {
  const dR = colorB.r - colorA.r;
  const dG = colorB.g - colorA.g;
  const dB = colorB.b - colorA.b;
  return new THREE.Color( colorA.r+dR*alpha, colorA.g+dG*alpha, colorA.b+dB*alpha );
};


// need delta time to make the animation speed indipendent from frame rate
var deltaTime = 0.0; // seconds b/w each frames
var prevTime = 0.0; // last recorded time

function updateDeltaTime() {
  nowTime = new Date();
  deltaTime = (nowTime - prevTime) / 1000;
  prevTime = nowTime;
}


class BlackHole{
  
  constructor() {

    // black sphere (event horizon)
    const sphereGeo = new THREE.SphereGeometry( 90, 20, 20 );
    const darkMat = new THREE.MeshStandardMaterial({ color: 'black' });
    this.sphereMesh = new THREE.Mesh( sphereGeo, darkMat );
    
    // =========================================================================
    // disk

    const diskColors = [
      new THREE.Color( 'lightyellow' ),
      new THREE.Color( 'orange' ),
      new THREE.Color( 'violet' ),
      new THREE.Color( 'blue' )
    ];

    this.revolveAxis = new THREE.Vector3( 0, 1, 0 );
    this.diskStart = 100;
    this.diskRange = 1000;
    this.diskThickness = 30;
    this.strength = 60; // for audio visualizer
    
   // particle variables (acceleration disk)
    this.diskParticleCount = 30000;
    this.diskParticles = new THREE.Geometry();
    const diskParticleMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 20,
      map: new THREE.TextureLoader().load( "spark1.png" ),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    // create individual disk particles
    for (let p = 0; p < this.diskParticleCount; p++) {

      // position
      const theta = Math.random() * 2*Math.PI;
      const radius = Math.random()*this.diskRange + this.diskStart;
      const x = radius * Math.cos( theta );
      const y = Math.random()*this.diskThickness - this.diskThickness/2;
      const z = radius * Math.sin( theta );
      let particle = new THREE.Vector3( x, y, z ); 
      this.diskParticles.vertices.push( particle );

      // color
      const segLen = (this.diskRange - 100) / (diskColors.length - 1);
      const zeroedR = radius - this.diskStart;
      if (zeroedR < segLen) {
        const alpha = zeroedR / segLen;
        this.diskParticles.colors.push( colorBetween(diskColors[0], diskColors[1], alpha) );
      } else if (zeroedR < 2*segLen) {
        const alpha = (zeroedR - segLen) / segLen;
        this.diskParticles.colors.push( colorBetween(diskColors[1], diskColors[2], alpha) );
      } else {
        const alpha = (zeroedR - 2*segLen) / segLen;
        this.diskParticles.colors.push( colorBetween(diskColors[2], diskColors[3], alpha) );
      }

      // sort particles for audio visualizer based on distance from the center
      particle.initY = y; 
      diskFrequencies[Math.floor( zeroedR / this.diskRange * 128 )].push(p);

    }

    this.diskParticleSystem = new THREE.Points( this.diskParticles, diskParticleMat );

    // =========================================================================
    // jet

    this.jetEnabled = false;
    this.jettingInterval = 1;
    this.jetCountDown = 0; // don't change, it's for jettingInterval
    this.jetMult = 30; // multiplier for jetAmount
    this.jetAmount = 0; // don't change, amount of particles to launch every time
    this.jetNext = 0; // don't change, id of next particle to launch
    this.jetDirection = 1; // don't change, for launching particles in both directions

    // particle variables (astrophysical jet)
    this.jetParticleCount = 5000;
    this.jetParticles = new THREE.Geometry();
    const jetParticleMat = new THREE.PointsMaterial({
      size: 60,
      color: 'lightskyblue',
      map: new THREE.TextureLoader().load( "spark1.png" ),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    // create individual jet particles
    for (let p = 0; p < this.jetParticleCount; p++) {
      let particle = new THREE.Vector3( 0, 0, 0 );
      particle.velocity = new THREE.Vector3( 0, 0, 0 );
      particle.jetted = false;
      this.jetParticles.vertices.push( particle );
    }

    this.jetParticleSystem = new THREE.Points( this.jetParticles, jetParticleMat );

    // =========================================================================
    // stars

    const starDstStart = 10000;
    const startDstRange = 100000;
    
    const starParticleCount = 1000;
    this.starParticles = new THREE.Geometry();
    const starParticleMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 200,
      map: new THREE.TextureLoader().load( "spark1.png" ),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    for ( let i = 0; i < starParticleCount; i++) {
      // position
      const theta = Math.random() * 2*Math.PI;
      const phi = Math.random() * 2*Math.PI;
      const radius = starDstStart + Math.random()*startDstRange;
      const x = radius * Math.sin( theta ) * Math.cos( phi );
      const y = radius * Math.sin( theta ) * Math.sin( phi );
      const z = radius * Math.cos( theta );
      let particle = new THREE.Vector3( x, y, z );
      this.starParticles.vertices.push( particle );
      this.starParticles.colors.push( new THREE.Color( Math.random()*0xffffff ) );
    }

    this.starParticleSystem = new THREE.Points( this.starParticles, starParticleMat );

  }

  show(scene) {
    scene.add( this.sphereMesh );
    scene.add( this.diskParticleSystem );
    scene.add( this.jetParticleSystem );
    scene.add( this.starParticleSystem );
  }

  onAnimate() {

    // update delta time
    updateDeltaTime();

    // audio listener for wall paper enigne, updates the audio arrary
    window.wallpaperRegisterAudioListener(listener);

    // audio visualizer Animation for disk
    let max = 0;
    for (const [i, part] of audio.entries()) {
      let dFreqs = diskFrequencies[i];
      for (const dFreq of dFreqs) {
        let dParticle = this.diskParticles.vertices[dFreq];
        dParticle.y = dParticle.initY + audio[i] * this.strength;
      }
      // get max of left and right channels
      if((i == 64 || i == 0) && max < part) 
        max = part;
    }

    // audio visualizer Animation for jet
    const clampVal = 1;
    this.jetAmount = this.jetMult*Math.min(clampVal, max) + 1;

    // =========================================================================
    // disk

    // for each disk particle
    const c = 2000; // overall revolving speed
    const p = 1.7; // how much faster when closer to the center
    const d = 50; // shift the distance from center for speed calculation
    let dpCount = this.diskParticleCount;
    while (dpCount--) {
      // revolve around the center, closer to the center will be faster
      let dParticle = this.diskParticles.vertices[dpCount];
      const dst = dParticle.distanceTo( this.sphereMesh.position ); // distance from the center
      const angularVelocity = c / Math.pow(dst-this.diskStart+d, p);
      dParticle.applyAxisAngle( this.revolveAxis, angularVelocity*deltaTime );
    }
    
    // flag to the particle system that we've changed its vertices.
    this.diskParticleSystem.geometry.verticesNeedUpdate = true;

    // =========================================================================
    // jet

    const verticalVelocity = 6;
    const scalar = 100;
    if (this.jetEnabled && !this.jetCountDown--) {
      while (this.jetAmount-- > 0) {
        // launch next jet particle
        let jParticle = this.jetParticles.vertices[this.jetNext];
        if (jParticle.jetted)
          jParticle.set( 0, 0, 0 ); // reuse
        else
          jParticle.jetted = true;
        // set velocity
        const radius = Math.random();
        const theta = Math.random() * 2*Math.PI;
        const x = radius * Math.cos( theta );
        const y = verticalVelocity * (this.jetDirection *= -1); // flip the direction
        const z = radius * Math.sin( theta );
        jParticle.velocity.set( x*scalar, y*scalar, z*scalar );
        // get ready for next one
        this.jetNext = (this.jetNext+1) % this.jetParticleCount
        this.jetCountDown = this.jettingInterval;
      }
    }

    // for each launched jet particle
    const angularVelocity = 5;
    let jpCount = this.jetParticleCount;
    while (jpCount--) {
      let jParticle = this.jetParticles.vertices[jpCount];
      if (jParticle.jetted) {
        // update particle position
        jParticle.applyAxisAngle( this.revolveAxis, angularVelocity * deltaTime );
        jParticle.velocity.applyAxisAngle( this.revolveAxis, angularVelocity * deltaTime );
        jParticle.add( jParticle.velocity.clone().multiplyScalar( deltaTime ) );
      }
    }

    // flag to the particle system that we've changed its vertices.
    this.jetParticleSystem.geometry.verticesNeedUpdate = true;

  }

}