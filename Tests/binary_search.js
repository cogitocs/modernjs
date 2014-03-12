function binarySearch(arr,findVal,leftIndex,rightIndex) { 
        //防止无穷递归 
        if(leftIndex > rightIndex) { 
            console.log("找不到"); 
            return; 
        } 
        //找到中间这个值 
       console.log(midIndex)
        var midIndex = Math.floor((leftIndex + rightIndex)/2); 
       console.log(midIndex)

        var midVal = arr[midIndex]; 
        //比较 
        if(midVal > findVal) { 
            //在左边查找 
            binarySearch(arr,findVal,leftIndex,midIndex - 1); 
        } else if(midVal < findVal) { 
            //在右边查找 
            binarySearch(arr,findVal,midIndex+1,rightIndex); 
        } else { 
          console.log("找到了，位置为：" + midIndex); 
            return; 
        } 
    } 
    var arr = [1,2,5,67,89,90]; 
    binarySearch(arr,90,0,arr.length -1);
    binarySearch(arr,67,0,arr.length -1); 
