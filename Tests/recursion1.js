//there are four people ,A,B,C,D. D's years is 10.b's year is one than a.and c t//han b.
function years(n){
if(n== 4){
return 10;
}else{
return years(n+1)-1;
}
}
console.log(years(3));
console.log(years(2));
console.log(years(1));
console.log(years(4));

