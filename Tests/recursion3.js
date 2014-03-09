// to get the max value by compare a int array.
var array =[1,2,3,4,5,6,7,8,9,10,12,30,0];
var Compare = function(array){
    if(array.length == 2){
       return array[0]>array[1]?array[0]:array[1];
    }else{
	    var temp_arr =[]; 
	    for(var i=0;i<array.length-1;++i){
	    temp_arr[i] = array[i];
	    }
       console.log(temp_arr);
       console.log(array);

     return Compare(temp_arr)>array[array.length-1]?Compare(temp_arr):array[array.length-1];
    }
}
       console.log(Compare(array))
