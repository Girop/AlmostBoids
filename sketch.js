let populationVal,speedLimit,viewDistance,separationForce,aligmentForce,cohesionForce;
let entities = [];
let clr = 0;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  // createCanvas(1000, 800);
  window.addEventListener('resize', resizeCanvasCallback, false);
  function resizeCanvasCallback() {
    resizeCanvas(windowWidth, windowHeight);

    if (windowHeight > windowWidth) {
      factor = windowHeight
      factdiv = 1080;

    } else {
      factor = windowWidth;
      factdiv = 1920;
    }
  }
  populationVal = 110;
  speedLimit = 3;
  viewDistance = 110;
  
  aligmentForce = 0.3;
  separationForce = 0.15;
  cohesionForce = 0.33;

  colorMode(HSB);
  

  
  //Boids init  
  for(let i = 0;i < populationVal;i++){
    entities[i] = new Boid(i,random(0,width),random(0,height));
  }
  
}

function draw() {
  background(0);
   clr += 1;
   clr %= 360;
  for(let i = 0;i < entities.length;i++){
    entities[i].Live(i);
  }

}

function mouseDragged(){
  entities.push(new Boid(entities.length + 1,mouseX,mouseY ) );
}


class Boid{
  constructor(i,x,y){
    this.a = 6;
    this.position = createVector(x,y);
    this.velocity = p5.Vector.random2D();
    this.acc = createVector();
    
    this.index = i;
  }

  Move(){

    this.velocity.add(this.acc);
    this.velocity.limit(speedLimit);
    this.position.add(this.velocity);
     
  } 

  
  NearbyCheck(){

    this.nearby = []; 

    for(let j = 0;j < entities.length;j++){
      let d = dist(this.position.x,this.position.y,entities[j].position.x,entities[j].position.y);
      if(this.index != j && d < viewDistance ){
        this.nearby.push(entities[j]);
      }
    }

  }

  BorderCheck(){

    if(this.position.x > width + 15){
      this.position.x  = -15;
    }else if(this.position.x < -15){
      this.position.x = width + 15; 
    }else if(this.position.y > height + 15){
      this.position.y = -15;
    }else if(this.position.y < -15){
      this.position.y = height + 15;
    }
  }

  Show(){
    fill(clr,100,100);
    // stroke(20,180,20,100);
    // stroke(this.fillclr);
    // strokeWeight(3);

    push();
    translate(this.position.x,this.position.y);
    rotate(this.velocity.heading());
    triangle(this.a*2,0,-this.a,-this.a,-this.a,this.a);
    pop();
  }


  Aligmnet(){
    let alVec = createVector();

    this.nearby.forEach(nearBoid =>{
      alVec.add(nearBoid.velocity);
    });
    
    
    alVec.normalize();
    alVec.mult(aligmentForce);

    this.acc.add(alVec);
  }


  Separtion(){
    let sepVec = createVector(0,0);
    
    this.nearby.forEach(nearBoid =>{
      let d = this.position.dist(nearBoid.position);
      let helpVec = createVector((this.position.x - nearBoid.position.x)/d,(this.position.y - nearBoid.position.y)/d);
      sepVec.add(helpVec);
    });

    
    sepVec.mult(separationForce);
    this.acc.add(sepVec);

  }

  Cohesion(){
    let weightCenter = createVector();

    this.nearby.forEach(nearBoid => {
      weightCenter.add(nearBoid.position);
    })

    weightCenter.div(this.nearby.length);

    let helpVec = createVector( weightCenter.x - this.position.x,weightCenter.y - this.position.y );
    helpVec.normalize();
    helpVec.limit(cohesionForce);

    this.acc.add(helpVec); 
  }


  Live(){

    this.NearbyCheck();
    
    if(this.nearby.length > 0){
      this.Aligmnet();
      this.Separtion();
      this.Cohesion();
    }
    
    
    this.BorderCheck();
    this.Move();
    this.Show();
    
    this.acc.mult(0);

    this.nearby = [];
  }
} 