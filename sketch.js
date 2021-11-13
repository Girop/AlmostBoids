let populationVal,speedLimit,viewDistance,separationForce,aligmentForce,cohesionForce,p;
let chunkNum;
let entities = [];
let Settings = new Map();
let Tiles = new Map();
let BoidsInChunks = new Map();

function setup() {

  populationVal = 5;
  speedLimit = 2;
  viewDistance = 50;
  
  aligmentForce = 0.3;
  separationForce = 0.15;
  cohesionForce = 0.33;

  chunkNum = 16;


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

    CreateChunks()
  }

  // Ogar sliderze
  let SpeedSlider = document.getElementById("Speed")
  SpeedSlider.addEventListener("change",speedchanged)
  function speedchanged(){
    speedLimit = SpeedSlider.value;
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
  
  CreateChunks()

  colorMode(HSB);

  for(let i = 0;i < populationVal;i++){

    entities[i] = new Boid(
      i,
      random(0,width),
      random(0,height),
      Math.floor(Math.random()*360)
      );
  }
}


function draw() {

  background(0,0,0);

  for(let i = 0;i < entities.length;i++){
    entities[i].Live();
  }

}

function mouseClicked(){
  p = Math.floor(Math.random() * 360);
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

function CreateChunks(){
  let i,j;
  i = 0;
  j = 0;

  for(let n =0; n< width; n+=width/chunkNum){
    for(let m = 0; m < height; m+= height/chunkNum){
      let size = [n,m,n + width/chunkNum,m + width/chunkNum]
      let key = str(j) + "-"+ str(i)
      Tiles.set(key,size)
      i++
    }
    i=0;
    j++
  }

  let empty = []
  for(let key1 of Tiles.keys){
    BoidsInChunks.set(key1,empty)
  }
}

class Boid{
  constructor(i,x,y,passClr){
    this.a = 6
    this.origin_clr = passClr
    this.clr = this.origin_clr

    this.position = createVector(x,y)
    this.velocity = p5.Vector.random2D()
    this.acc = createVector()

    this.index = i
    this.nearby = []

  }

  Move(){

    this.velocity.add(this.acc);
    this.velocity.limit(speedLimit);
    this.position.add(this.velocity);
     
    this.acc.mult(0);
  } 

  Chunks(){
    for(let j = 0; j < chunkNum; j++){

      for(let i = 0;i < chunkNum;i++){
        let key = str(j) + "-"+ str(i)
        let a = Tiles.get(key)
        if(this.position.y > a[1] && this.position.y < a[3]){
          if(this.position.x > a[0] && this.position.x < a[2]){
            let val = BoidsInChunks.get(key);
            val.push(this.index)
            if(Tiles.has(val)){
              deleteExistingInMap(this.index); // Kolejna iteracja, serio ? 
            }

            BoidsInChunks.set(key,val)
            this.chunk = key

            return true
          }
        }
      }
    }

    return false
  }


  NearbyCheck(){

    this.nearby = [];

    for(let j = 0;j < entities.length;j++){
      let entity = entities[j]

        let d = dist(
          this.position.x, 
          this.position.y, 
          entity.position.x, 
          entity.position.y
        );
        if(this.index != j && d < viewDistance ){
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
    fill(this.clr,80,100);

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

  Live(){

    this.Chunks()
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
    console.log(this.chunks)
    this.ColourChange() 
    this.Show()
    
  }
} 