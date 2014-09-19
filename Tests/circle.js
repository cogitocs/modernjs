$(document).ready(function(){
//var c = $("#circle");
var c = document.getElementById("circle");
console.log(c);
var ctx = c.getContext("2d");
console.log(ctx);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#163B62";
    ctx.beginPath();
    ctx.arc(70,70,40,0,Math.PI*2,false);
    ctx.stroke();
    
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(160,70,40,0,Math.PI*2,false);
    ctx.stroke();
  
    
    ctx.strokeStyle = "#BF0628";
    ctx.beginPath();
    ctx.arc(250,70,40,0,Math.PI*2,false);
    ctx.stroke();
   
    
    ctx.strokeStyle = "#EBC41F";
    ctx.beginPath();
    ctx.arc(110,110,40,0,Math.PI*2,false);
    ctx.stroke();
  
    
    ctx.strokeStyle = "#198E4A";
    ctx.beginPath();
    ctx.arc(200,110,40,0,Math.PI*2,false);
    ctx.stroke();
})
