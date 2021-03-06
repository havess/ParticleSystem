"use strict";

$(function() {


/*-------- VARIABLES ---------*/
var particles = [];
var emitters = []; 
var fields = [];
var songNodes = [];

var eX, eY;
var scrollHeightOffset;

var dMaxParticles = 20000,
    dEmissionRate = 20,
    dMass = 150,
    particleSize = 2,
    objectSize = 6; // drawSize of emitter/field

var onClickType = 0;
var btnClass = "btn-default";
var lineRequested;
var circleRequested;
var modifyRequest;
var foundObject;
var audioNumber = 1;
var selectedObject = null;
var mode = "add"; 


/*-------- JQUERY ---------*/
//decides whether to put a positive or negative charge, change text on collapsed dropdown
$( "html" ).keypress(function( event ) {
  var key = event.which;
  //a
  if ( key == 97 ) {
    mode = "add";
  }else if( key == 115){
    mode = "remove";
  }else if( key == 100){
    mode = "modify";
  }else if( key == 32){
    $(".Particle-menu").slideToggle(1000);
  }else if(key == 99){
    if(onClickType != 3){
       onClickType++; 
    }else{
       onClickType = 0;
       lineRequested = false;
       circleRequested = false;
    }
    updateDropdown();
  }
  $(".mode").text("Current mode: " + mode);
});

$("#fieldDropdown li").on('click','a',  function(e){
    e.preventDefault();
    var type = $(this).html()
    $("#charge").empty().append(type);
    if(type == "Positive"){
        onClickType = 0;
        lineRequested = false;
        circleRequested = false;
    }else if(type == "Negative"){
        onClickType = 1;
        lineRequested = false;
        circleRequested = false;
    }else if(type == "Emitter"){
        onClickType = 2;
        circleRequested = false;
    }else if (type == "Song Node"){
        onClickType = 3;
        lineRequested = false;
    }
    
});

$("#songNames li").on('click','a',  function(e){
    e.preventDefault();
    var type = $(this).html()
    $("#song").empty().append(type);
});

$("#Instructions-Label").on('click', function (e) {
    $(".Instructions").slideToggle();
});

$("#typeDrop").on('click',function(e){
    updateDropdown();
});
//display menu
$(".Menu-hidden").on('click', function(e){
    $(".Particle-menu").slideToggle(1000);
});

$(".Reset").on('click', function(e){
    reset();
});

$("canvas").click(function(e){
    e.preventDefault();
    scrollHeightOffset = $(document).scrollTop();
    if(mode == "add"){
        if(onClickType === 0){
            fields.push(new Field(new Vector(e.clientX - canvas.getBoundingClientRect().left, e.clientY + scrollHeightOffset), Math.abs(getMass())));
        }else if(onClickType === 1){
            fields.push(new Field(new Vector(e.clientX- canvas.getBoundingClientRect().left, e.clientY + scrollHeightOffset), -Math.abs(getMass())));
        }else if (onClickType === 2){
            if(!lineRequested){
                eX = e.clientX;
                eY = e.clientY;
                lineRequested = true;
            }else{
                lineRequested = false;
                emitters.push(new Emitter(new Vector(eX, eY), Vector.fromAngle(getAngle(), 2)));
            }
        }else if (onClickType === 3){
            if(!circleRequested){
                eX = e.clientX;
                eY = e.clientY;
                circleRequested = true;
            }else{
                circleRequested = false;
                var song = document.createElement('audio');
                song.loop = true;
                song.id = "song" + audioNumber;
                audioNumber++;
                song.src = getAudioFile();
                console.log(song.src + " " + song.id);
                songNodes.push(new SongNode(new Vector(eX,eY), song, radialDistance(e.clientX - eX, e.clientY - eY)));
            }
        }
    }else if(mode == "remove"){
        removeObject();
    }
});

$("canvas").on("mousedown", function(e){
    e.preventDefault();
    if(mode == "modify"){
        modifyRequest = true;
    }
});

$("canvas").on("mouseup", function(e){
    e.preventDefault();
    if(modifyRequest){
        modifyRequest = false;
        selectedObject = null;
    }
})

$("canvas").mousemove(function(e){
      window.mouseXPos = e.pageX;
      window.mouseYPos = e.pageY;  
}); 

function updateDropdown(){
    var newClass = btnClass
    var type = $("#charge").html();

    switch(onClickType){
        case 0:
            newClass = "btn-success";
            type = "Positive";
            break;
        case 1:
            newClass = "btn-danger";
            type = "Negative"
            break;
        case 2:
            newClass = "btn-info";
            type = "Emitter"
            break;
        case 3:
            newClass = "btn-warning";
            type = "Song Node";
            break;
    }

    $("#dropdownMenu1").removeClass(btnClass).addClass(newClass);
    $("#charge").empty().append(type);
    btnClass = newClass
}

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

window.onresize = resize;

resize();

/* -------- GETTERS AND SETTERS -------- */

function getMaxP(){
    var val = $("#particles").val();
    if(val != ""){
        return parseInt(val);
    }else{
        return dMaxParticles;
    }
}

function getMass(){
    var val = $("#mass").val();
    if(val != ""){
        return parseInt(val);
    }else{
        var obj = $("#charge").html()
        if(obj === "Positive"){
            return dMass
        }else{
            return -dMass
        }
    }
}

function getEmissionRate(){
    var val = $("#emission").val();
    if(val != ""){
        return parseInt(val);
    }else{
        return dEmissionRate;
    }
}

function resize(){
    canvas.width = $("canvas").width();
    canvas.height = window.innerHeight;   
}

function getAngle(){
    return Math.atan2(window.mouseYPos - eY, window.mouseXPos - eX);
}

function isMouseOver(p){
    return (p.position.x + objectSize*2 >= mouseXPos && p.position.y + objectSize*2 >= mouseYPos) &&
            (p.position.x - objectSize*2 <= mouseXPos && p.position.y - objectSize*2 <= mouseYPos);
}

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype.add = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
};

Vector.prototype.getMagnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.getAngle = function () {
    return Math.atan2(this.y, this.x);
};

Vector.fromAngle = function (angle, magnitude) {
    return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};

function Particle(point, velocity, acceleration) {
    this.position = point || new Vector(0, 0);
    this.velocity = velocity || new Vector(0, 0);
    this.acceleration = acceleration || new Vector(0, 0);
}

Particle.prototype.applyFields = function (fields) {
    
    // starting acceleration in current frame
    var totalAccelerationX = 0;
    var totalAccelerationY = 0;

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];

        // find the distance between the particle and the field
        var vectorX = field.position.x - this.position.x;
        var vectorY = field.position.y - this.position.y;

        // calculate the force 
        var force = field.mass / Math.pow(vectorX * vectorX + vectorY * vectorY, 1.5);

        // add to the total acceleration the force  by distance
        totalAccelerationX += vectorX * force;
        totalAccelerationY += vectorY * force;
    }

    // update acceleration
    this.acceleration = new Vector(totalAccelerationX, totalAccelerationY);
};

Particle.prototype.move = function () {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
};

function Field(point, mass) {
    this.position = point;
    this.setMass(mass);
}

Field.prototype.setMass = function (mass) {
    this.mass = mass || 100;
    this.drawColor = mass < 0 ? "#f00" : "#0f0";
};


function Emitter(point, velocity, spread) {
    this.position = point; // Vector
    this.velocity = velocity; // Vector
    this.spread = spread || Math.PI / 32; // possible angles = velocity +/- spread
    this.drawColor = "white"; // So we can tell them apart from Fields later
}

Emitter.prototype.emitParticle = function () {
    // Use an angle randomized over the spread so we have more of a "spray"
    var angle = this.velocity.getAngle() + this.spread - (Math.random() * this.spread * 2);

    // emitter velocity magnitude
    var magnitude = this.velocity.getMagnitude();

    // emitter position
    var position = new Vector(this.position.x, this.position.y);

    // new velocity based off of calculated angle and magnitude
    var velocity = Vector.fromAngle(angle, magnitude);

    // return particle
    return new Particle(position, velocity);
};

function SongNode(point, audioElement , radius, minVolume, maxVolume){
    this.position = point;//coordinate
    this.song = audioElement;// file path for audio file
    this.radius = radius;
    this.minVolume = minVolume || 0; //number of particles for the file to play.
    this.maxVolume = maxVolume || 10000; //number of particles needed for max volume
    this.containedParticles = 0;
    this.drawColor = "orange";
}

SongNode.prototype.calcSongState = function(particles){
    this.containedParticles = 0;
    for(var i = 0; i < particles.length; i ++){
        var p = particles[i];
        var deltaX = p.position.x - this.position.x;
        var deltaY = p.position.y - this.position.y;
        if(radialDistance(deltaX, deltaY) <= this.radius){
            this.containedParticles++;
        }
    }

    var volume = this.containedParticles / (this.maxVolume + this.minVolume);
    if(volume >= 1.0){volume = 1.0}

    if (this.song.paused && this.containedParticles > this.minVolume){
        this.song.play();
        this.song.volume = volume;
    }else if(!this.song.paused && this.containedParticles > this.minVolume){
        this.song.volume = volume;
    }else if(!this.song.paused || this.containedParticles < this.minVolume){
        this.song.pause();
    }else if (this.containedParticles > this.minVolume){
        this.song.play();
    }
    
}

SongNode.prototype.drawAnalyserCircle = function (){
    //TODO: draws circle that "beats" to the song intensity.
}


function addNewParticles() {
    // if at max, stop emitting.
    if (particles.length > getMaxP()) return;

    for (var i = 0; i < emitters.length; i++) {
        // emit emissionRate particles and put in array
        for (var j = 0; j < getEmissionRate(); j++) {
            particles.push(emitters[i].emitParticle());
        }

    }
}

function plotParticles(boundsX, boundsY) {
    // array to hold particles within bounds
    var currentParticles = [];

    for (var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        var pos = particle.position;

        // checks for particles position, if out of bounds moves on. if not here there will be considerable lag after
        //a while.
        if (pos.x < 0 || pos.x > boundsX || pos.y < 0 || pos.y > boundsY) continue;

        // update velocities and accelerations
        particle.applyFields(fields);
        //self explanatory
        particle.move();

        // add to current particle list
        currentParticles.push(particle);
    }

    // update global particle reference
    particles = currentParticles;

    for(var i = 0; i < songNodes.length; i++){
        var node = songNodes[i];
        node.calcSongState(particles);
    }
}

function drawParticles() {
    ctx.fillStyle = 'white';
    for (var i = 0; i < particles.length; i++) {
        var position = particles[i].position;
        ctx.fillRect(position.x, position.y, particleSize, particleSize);
    }
}

//this works for now but looking into implementing quadtree once I find time to write out the structure
function removeObject(){
    for(var i = 0; i < fields.length; i++){
        var p = fields[i];
        if(isMouseOver(p)){
            fields.splice(i,1);
            foundObject = true;
        }
    }
    if(!foundObject){
        for(var i = 0; i < emitters.length; i++){
            var p = emitters[i];
            if(isMouseOver(p)){
                emitters.splice(i,1);
                foundObject = true;
            }
        }
        if(!foundObject){
            for(var i = 0; i < songNodes.length; i++){
                var p = songNodes[i];
                if(isMouseOver(p)){
                    $("#" + p.song.id).remove();
                    p.song.pause();
                    console.log(p.song.id);
                    songNodes.splice(i,1);
                    foundObject = true;
                }
            }
        }
        
    }
    foundObject = false;
}

function getAudioFile(){
    var song = document.getElementById("song");
    var text = song.textContent || song.innerText; //Thanks for being different IE
    var nameEnd;
    var skip;
    var fileName = new String();
    var lastFirstLetter = 0;
    for(var i = 0; i < text.length; i++){
        var cur = text.charAt(i);
        if(cur === " " && !skip){
            fileName += text.substring(lastFirstLetter, i);
            lastFirstLetter = i + 1;
        }else if (cur === "-"){
            fileName += "_";
            lastFirstLetter = i + 2;
            skip = true;
        }else if(i === text.length - 1){
            fileName += text.substring(lastFirstLetter, i + 1);
        }else{
            skip = false;
        }
    }
    return "Songs/" + fileName + ".mp3";
}

function getHoveredObject(){
    if(modifyRequest  && selectedObject === null){
        for(var i = 0; i < fields.length; i++){
            var p = fields[i];
            if(isMouseOver(p)){
                selectedObject = p;
                foundObject = true
            }
        }
        if(!foundObject){
            for(var i = 0; i < emitters.length; i++){
                var p = emitters[i];
                if(isMouseOver(p)){
                    selectedObject = p;
                    foundObject = true;
                }
            }
            if(!foundObject){
                for(var i = 0; i < songNodes.length; i++){
                    var p = songNodes[i];
                    if(isMouseOver(p)){
                        selectedObject = p;
                        foundObject = true;
                    }
                }
            }
        }
        foundObject = false;
        return selectedObject;
    }else{
        return selectedObject;
    }
}

function radialDistance(deltaX,deltaY){
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
}

function dynamicHintCircle(x,y,radius){
    ctx.fillStyle =  "rgba(67, 183, 222, 0.4)";
    ctx.beginPath();
    ctx.arc(x,y,radius,0, Math.PI *2);
    ctx.closePath();
    ctx.fill();
}

function staticHintCircle (object){
    ctx.fillStyle =  "rgba(67, 183, 222, 0.2)";
    ctx.beginPath();
    if(modifyRequest && getHoveredObject() != null && object.position === getHoveredObject().position){
        object.position.x = mouseXPos;
        object.position.y = mouseYPos;
    }
    ctx.arc(object.position.x, object.position.y, object.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

function drawCircle(object) {
    ctx.fillStyle = object.drawColor;
    ctx.beginPath();
    if(modifyRequest && getHoveredObject() != null && object.position === getHoveredObject().position){
        object.position.x = mouseXPos;
        object.position.y = mouseYPos;
    }
    ctx.arc(object.position.x, object.position.y, objectSize, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

function drawLine(){
    ctx.beginPath();
    ctx.moveTo(eX, eY);
    ctx.lineTo(window.mouseXPos, window.mouseYPos);
    ctx.strokeStyle = 'white';
    ctx.stroke();
 }

function loop() {
    clear();
    update();
    draw();
    queue();
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function reset(){
    particles = [];
    emitters = [];
    fields = [];
    clear();
}

function update() {
    addNewParticles();
    plotParticles(canvas.width, canvas.height);
}

function draw() {
    if(circleRequested){
        dynamicHintCircle(eX,eY,radialDistance(mouseXPos - eX, mouseYPos - eY));
    }
    songNodes.forEach(drawCircle);
    fields.forEach(drawCircle);
    emitters.forEach(drawCircle);
    songNodes.forEach(staticHintCircle);
    if(lineRequested){
       drawLine();
    }
    drawParticles();

}

function queue() {
    window.requestAnimationFrame(loop);
}
loop();

});
