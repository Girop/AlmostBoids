let StartPopVal,speedLimit,viewDistance,separationForce,aligmentForce,cohesionForce,p,populationVal;
let popInput;
let entities = [];
let fadingEntities = [];
let Settings = new Map();


function setup() {
  colorMode(HSB);

  createCanvas(window.innerWidth, window.innerHeight);


  window.addEventListener('resize', resizeCanvasCallback, false);
  function resizeCanvasCallback() {
    const bodyElem = document.getElementsByTagName("body")[0]
    resizeCanvas(windowWidth, windowHeight);

    if (windowHeight > windowWidth) {
      factor = windowHeight
      factdiv = 1080;

    } else {
      factor = windowWidth;
      factdiv = 1920;
    }
  }

  
  // Three basic rules don't depend on SpeedLimit
  // let SpeedSlider = document.getElementById("SpeedLimit")
  // SpeedSlider.addEventListener("change", SpeedChanged)
  // function SpeedChanged(){
  //   speedLimit = SpeedSlider.value;
  // } 


  popInput = document.getElementById('Population')
  popInput.addEventListener('change',popChange) 
  function popChange() {
    populationVal = popInput.value;
    if(populationVal > entities.length){

      for(let i = 0; i < populationVal - entities.length;i++){
        entities.push(new Boid(
          entities.length + 1, 
          Math.floor(Math.random() * width), 
          Math.floor(Math.random() * height),
          Math.floor(Math.random() * 360) 
        ))
      }
    } else if(populationVal < entities.length){
      for(let i = 0; i < entities.length - populationVal;i++){
        fadingEntities.push(entities[i])
      }
    }
  }

  let CheckBoxes = document.querySelectorAll("input[type=checkbox]")
  CheckBoxes.forEach( checkbox =>{
    Settings.set(checkbox.name,checkbox.checked)
  })

  for(let checkbox of CheckBoxes){
    checkbox.addEventListener('change',function(){
      Settings.set(checkbox.name,checkbox.checked)
    })
  }
  
  StartPopVal = 10;
  speedLimit = 3;
  viewDistance = 50;
  
  aligmentForce = 0.3;
  separationForce = 0.16;
  cohesionForce = 0.33;

 
  
  //Boids init  
  for(let i = 0;i < StartPopVal;i++){

    entities[i] = new Boid(
      i,
      random(0,width),
      random(0,height),
      Math.floor(Math.random()*360)      
      );
  } 
}

function draw(){

  background(0);
  if(fadingEntities.length > 0){
    for(let i = 0; i < fadingEntities.length;i++){
      fadingEntities[i].Live(true)
    }
  }

  for(let i = fadingEntities.length;i < entities.length;i++){
    entities[i].Live()
  }
  
  document.getElementById("BoidCounter").innerHTML = entities.length
}

function mousePressed() {
  p = Math.floor(Math.random() * 360)
}

function mouseReleased() {
  popInput.value = entities.length;
}

function mouseDragged(){
  
  entities.push(new Boid(
    entities.length + 1,
    mouseX,
    mouseY,
    Math.floor(Math.random()*360)
    ) 
  );
}

const HSBToRGB = (h, s, b) => {
  s /= 100;
  b /= 100;
  const k = (n) => (n + h / 60) % 6;
  const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return [255 * f(5), 255 * f(3), 255 * f(1)];
};


class Boid{
  constructor(i,x,y,passClr){
    this.a = 6;
    this.position = createVector(x,y);
    this.velocity = p5.Vector.random2D();
    this.acc = createVector();
    this.origin_clr = passClr;
    this.clr = this.origin_clr;
    this.groupClr = this.clr;

    this.alpha = 100  

    this.index = i
    this.nearby = []
  }

  Move(){

    this.velocity.add(this.acc);
    this.velocity.limit(speedLimit);
    this.position.add(this.velocity);
     
    this.acc.mult(0);
  } 

  
  NearbyCheck(){

    this.nearby = [];

    for(let j = 0;j < entities.length;j++){
      let entity = entities[j]
        let dVec = createVector(entity.position.x, entity.position.y)
        let d = dVec.dist(this.position)

        if(this.index != j && d < viewDistance ){
          // let head = this.velocity.heading()
          // console.log(head)
          this.nearby.push(entity);
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

  ColourChange(){
    this.clr = this.origin_clr;

    
    if(this.nearby.length > 0){
      let newClr = this.nearby[0].clr;
      for(let nearbyEntity of this.nearby){
        if (nearbyEntity.clr != this.clr){
          newClr = nearbyEntity.clr
        }
      }
      
      this.clr = newClr
      this.colorsApperanceMap = {} 
      // this.colorsApperanceMap[this.clr] = 1
      this.visited = []
      this.colorCount = 0
      
      this.depthFirstSearch(this);
      let currentMax = 0
      let currentMaxClr = undefined
      for(const [key, value] of Object.entries(this.colorsApperanceMap)){
        if(value > currentMax){
          currentMaxClr = key
          currentMax = value
        } 
      } 
      // console.log(this.clr, currentMaxClr)
      this.clr = parseFloat(currentMaxClr);
      
    }
    else{
      this.clr = this.origin_clr
    }
    this.clr %= 360;
    this.groupClr = this.clr

    fill(this.clr,80,100)
    
  }
  
  Fading(){
    console.log(this.GroupClr)
    let DyingClr = HSBToRGB(this.GroupClr,80,100)
    // console.log(DyingClr)
    this.clr = DyingClr

    colorMode(RGB)

    if(alpha > 0){
      fill(this.clr,alpha)
      this.alpha--
    } else {
      entities.splice(this.index)
    }
    
    colorMode(HSB)
  }

  Show(){
    push();
    noStroke();
    translate(this.position.x,this.position.y);
    rotate(this.velocity.heading());
    triangle(this.a*2,0,-this.a,-this.a,-this.a,this.a);
    pop();
  }

  Alignment(){
    let alVec = createVector();

    this.nearby.forEach(nearBoid =>{
      alVec.add(nearBoid.velocity);
    });
    
    
    alVec.normalize();
    alVec.mult(aligmentForce);

    this.acc.add(alVec);
  }

  Separation(){
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

  depthFirstSearch(boid){
    // colorsApperanceMap = {
    //   color: count,

    // }
    if(this.visited.includes(boid.index)) return ;
     
    this.visited.push(boid.index)
    if (this.colorsApperanceMap?.[boid.clr]){
      this.colorsApperanceMap[boid.clr] += 1

    }
    else{
      this.colorsApperanceMap[boid.clr] = 1
    }
    for(let nearbyBoid of boid.nearby){
      // appending colors/ incrementing count

      
      this.depthFirstSearch(nearbyBoid)
    }
  }

  RelationDraw(){
    this.nearby.forEach( nearBoid => {
      strokeWeight(0.25);  
      stroke(0,0,100);
      line(this.position.x,this.position.y,nearBoid.position.x,nearBoid.position.y);
    })
  }


  Live(fader = false){

    this.NearbyCheck()
    
    if(this.nearby.length > 0){
      for(let setting of Settings){
        if(setting[1]){
          eval(setting[0])
        }
      }
    }
    

    this.BorderCheck()
    this.Move()
    if(!fader){
      this.ColourChange()
    } else {
      this.Fading()
    }
    this.Show()
    
  }
} 