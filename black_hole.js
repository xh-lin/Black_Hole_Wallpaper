
class BlackHole{

  constructor() {
    // black sphere
    var geometry = new THREE.SphereGeometry( 30, 30, 30 );
    var material = new THREE.MeshStandardMaterial({ color: 'black' });
    this.sphere_mesh = new THREE.Mesh( geometry, material );

    /* 
      Three.js particle tutorial
      https://aerotwist.com/tutorials/creating-particles-with-three-js/ 
    */
   // create particle variables
    this.particleCount = 20000;
    this.particles = new THREE.Geometry();
    var pMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 5,
    });

    this.y_axis = new THREE.Vector3( 0, 1, 0 );
    this.disk_min = 50;
    this.disk_range = 3000;

    // create individual particles
    for (var p = 0; p < this.particleCount; p++) {
      var l = Math.random() * this.disk_range + this.disk_min
      var d = Math.random() * 2 * Math.PI
      var pX = l * Math.cos( d )
      var pY = Math.random() * 10 - 5;
      var pZ = l * Math.sin( d )
      var particle = new THREE.Vector3( pX, pY, pZ );
      // add this particle to the geometry
      this.particles.vertices.push( particle );
    }

    // create the particle system
    this.particleSystem = new THREE.Points( this.particles, pMaterial );
  }

  show(scene) {
    scene.add( this.sphere_mesh );
    scene.add( this.particleSystem );
  }

  onAnimate() {
    // for each particle
    var pCount = this.particleCount;
    while (pCount--) {
      var particle = this.particles.vertices[pCount];

      // update particle position
      var dst = particle.distanceTo( this.sphere_mesh.position )
      var c = 30
      var p = 1.7
      var d = 50
      var angular_velocity = c / Math.pow(dst-this.disk_min+d, p)
      particle.applyAxisAngle( this.y_axis, angular_velocity );
    }

    // flag to the particle system that we've changed its vertices.
    this.particleSystem.geometry.verticesNeedUpdate = true;
  }

}