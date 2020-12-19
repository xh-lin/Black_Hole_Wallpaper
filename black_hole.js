/* 
  Reference(s):
  Aerotwist - Creating Particles with Three.js
  https://aerotwist.com/tutorials/creating-particles-with-three-js/ 
*/

// get color in between from color A to B
// alpha: [0, 1]
colorBetween = function(colorA, colorB, alpha) {
  const dR = colorB.r - colorA.r;
  const dG = colorB.g - colorA.g;
  const dB = colorB.b - colorA.b;
  return new THREE.Color( colorA.r+dR*alpha, colorA.g+dG*alpha, colorA.b+dB*alpha );
};
// audio listener
let audio = [];
const listener = arr => {
  audio = arr;
}
// audio frequency
let diskFrequencies = [];
for (var i = 0; i < 128; i++){
  diskFrequencies.push([]);
}

class BlackHole{
  
  constructor() {

    var colors = [];
    colors.push(new THREE.Color('lightyellow'));
    colors.push(new THREE.Color('orange'));
    colors.push(new THREE.Color('violet'));
    colors.push(new THREE.Color('blue'));

    // black sphere (event horizon)
    const sphereGeo = new THREE.SphereGeometry( 60, 60, 60 );
    const darkMat = new THREE.MeshStandardMaterial({ color: 'black' });
    this.sphereMesh = new THREE.Mesh( sphereGeo, darkMat );
    
    // =========================================================================
    // disk
    this.rotateAxis = new THREE.Vector3( 0, 1, 0 );
    this.diskStart = 100;
    this.diskRange = 1000;
    this.diskThickness = 30;
    
   // particle variables (acceleration disk)
    this.diskParticleCount = 30000;
    this.diskParticles = new THREE.Geometry();
    const diskParticleMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 20,
      map: new THREE.TextureLoader().load(
        "spark1.png"
      ),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    // create individual disk particles
    for (var p = 0; p < this.diskParticleCount; p++) {
      // position
      const theta = Math.random() * 2*Math.PI;
      const radius = Math.random()*this.diskRange + this.diskStart;
      const x = radius * Math.cos( theta );
      const y = Math.random()*this.diskThickness - this.diskThickness/2;
      const z = radius * Math.sin( theta );
      var particle = new THREE.Vector3( x, y, z ); 
      this.diskParticles.vertices.push( particle );
      // color
      if (radius < 400) {
        const a = (radius - this.diskStart) / 300;
        this.diskParticles.colors.push( colorBetween(colors[0], colors[1], a) );
      } else if (radius < 700) {
        const a = (radius - 400) / 300;
        this.diskParticles.colors.push( colorBetween(colors[1], colors[2], a) );
      } else {
        const a = (radius - 700) / 300;
        this.diskParticles.colors.push( colorBetween(colors[2], colors[3], a) );
      }
      // audio
      particle.InitialValY = y; 
      var newIndec = Math.floor(radius * 128 / 1200)
      diskFrequencies[newIndec].push(p);
    }

    this.diskParticleSystem = new THREE.Points( this.diskParticles, diskParticleMat );

    // =========================================================================
    // jet
    this.isJetting = true;
    this.jettingInterval = 1;
    this.jetCountDown = 0;
    this.jetMult = 0;
    this.jetNext = 0;
    this.jetDirection = 1; // 1 / -1

    // particle variables (astrophysical jet)
    this.jetParticleCount = 30000;
    this.jetParticles = new THREE.Geometry();
    const jetParticleMat = new THREE.PointsMaterial({
      size: 60,
      color: 'lightskyblue',
      map: new THREE.TextureLoader().load(
        "spark1.png"
      ),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    // create individual jet particles
    for (var p = 0; p < this.jetParticleCount; p++) {
      var particle = new THREE.Vector3( 0, 0, 0 );
      particle.velocity = new THREE.Vector3( 0, 0, 0 );
      particle.jetted = false;
      this.jetParticles.vertices.push( particle );
    }

    this.jetParticleSystem = new THREE.Points( this.jetParticles, jetParticleMat );

    // =========================================================================
    // stars
    const starCount = 1000;
    this.starParticles = new THREE.Geometry();
    const starParticleMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 200,
      map: new THREE.TextureLoader().load(
        "spark1.png"
      ),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    for ( var i = 0; i < starCount; i++) {
      // position
      const theta = Math.random() * 2*Math.PI;
      const phi = Math.random() * 2*Math.PI;
      const radius = 10000 + Math.random()*100000;
      const x = radius * Math.sin( theta ) * Math.cos( phi );
      const y = radius * Math.sin( theta ) * Math.sin( phi );
      const z = radius * Math.cos( theta );
      var particle = new THREE.Vector3( x, y, z );
      this.starParticles.vertices.push( particle );
      this.starParticles.colors.push( new THREE.Color( Math.random()*0xffffff ) );
    }

    this.stars = new THREE.Points( this.starParticles, starParticleMat );
  }

  show(scene) {
    scene.add( this.sphereMesh );
    scene.add( this.diskParticleSystem );
    scene.add( this.jetParticleSystem );
    scene.add( this.stars );
  }

  onAnimate() {
    // audio listener
    window.wallpaperRegisterAudioListener(listener);
    // for each disk particle
    var dpCount = this.diskParticleCount;
    while (dpCount--) {
      var dParticle = this.diskParticles.vertices[dpCount];
      // update particle position
      const dst = dParticle.distanceTo( this.sphereMesh.position );
      const c = 30;
      const p = 1.7;
      const d = 50;
      const angular_velocity = c / Math.pow(dst-this.diskStart+d, p);
      dParticle.applyAxisAngle( this.rotateAxis, angular_velocity );
    }
    // audio Animation for disk
    var max = 0;
    for (const [i, part] of audio.entries()) {
      var dFreq = diskFrequencies[i];
      for (var j = 0; j < dFreq.length; j++) {
        this.diskParticles.vertices[dFreq[j]].y = dParticle.InitialValY + audio[i] * 60;
      }
      if(( i == 64 || i == 0 ) && max < part){
        max = part;
      }
    }
    // jet 
    this.jetMult = 30 * max + 0.1;
    
    // flag to the particle system that we've changed its vertices.
    this.diskParticleSystem.geometry.verticesNeedUpdate = true;

    // =========================================================================
    // launch next jet particle
    if (this.isJetting && !this.jetCountDown--) {
      for (var i = 0; i < this.jetMult; i++) {
        var jParticle = this.jetParticles.vertices[this.jetNext];
        if (jParticle.jetted) {
          // reuse
          jParticle.set( 0, 0, 0 );
          jParticle.velocity.set( 0, 0, 0 );
        }
        else {
          jParticle.jetted = true;
        }
        // set velocity
        const radius = Math.random();
        const theta = Math.random() * 2*Math.PI;
        const x = radius * Math.cos( theta );
        const y = 8 * (this.jetDirection *= -1);
        const z = radius * Math.sin( theta );
        jParticle.velocity.set( x, y, z );
        // get ready for next one
        this.jetNext = ++this.jetNext % this.jetParticleCount
        this.jetCountDown = this.jettingInterval;
      }
    }

    // for each launched jet particle
    var jpCount = this.jetParticleCount;
    while (jpCount--) {
      var jParticle = this.jetParticles.vertices[jpCount];
      if (jParticle.jetted) {
        // update particle position
        const angular_velocity = 0.08;
        jParticle.applyAxisAngle( this.rotateAxis, angular_velocity );
        jParticle.velocity.applyAxisAngle( this.rotateAxis, angular_velocity );
        jParticle.add(jParticle.velocity);
      }
    }
    // flag to the particle system that we've changed its vertices.
    this.jetParticleSystem.geometry.verticesNeedUpdate = true;
  }

}