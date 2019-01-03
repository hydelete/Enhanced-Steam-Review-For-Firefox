(function(){

jQuery( document ).ready(function( $ ) {
  
	//console.log('start' + $().jquery);
	
	//URL samples: 
	//https://steamcommunity.com/id/hydelete/recommended/?p=3
	//https://steamcommunity.com/profiles/76561198074972488/recommended/?p=1


	let hdReviewCount = 200;  //current user's total number of reviews,read from DOM
	
	if( '' !== jQuery("#rightContents .review_stat .giantNumber")[0].innerHTML ){
		
		hdReviewCount = jQuery("#rightContents .review_stat .giantNumber")[0].innerHTML;
		
	}
	
	
	const _steam_showReviewsPerPage = 10;
	let hdThePageCount = Math.floor(( parseInt(hdReviewCount)  + (_steam_showReviewsPerPage - 1) ) / _steam_showReviewsPerPage);

	
	let hdNodesPostList = [];  //cell: reviews on one page
	let hdNodesTimeList = [];  //cell: time of reviews on one page
	let hdPostListSuccessFlags = [];   //flag for Ajax completion
	
	let hdIdx = 0;   //hdEntities position
	let hdEntities = [];  //all reviews from current user
	let hdUrl = window.location.href;
	let hdPageIndex = 1;
	let hdUserId = "hydelete";  //yes, it's my user id
	let hdProfileNo = "76561198074972488"; //yes, it's my profile number
	
	let hdPOSTEDTIME = "TIME_IDX";  //with hdEntities
	let hdINNERHTML = "INNERHTML";	//with hdEntities

	let hdLanguages = {};
	hdLanguages.English = "en";  //sample English: "Posted April 11, 2017.	Last edited September 25, 2017."
	hdLanguages.CN = "cn";    //sample Zhongwen: "发布于 2017年4月11日。	最后编辑于 2017年9月25日。"
	
	let hdCurrentLang = 0;   //  0 = English;  1 = simpleZh
	
	//const
	const _last_edited = ["Last edited", "编辑于"];
	const _edited = ["edited", "编辑于 "];
	const _posted = ["posted", "发布于"];
	const _urlParam_pageIndex = "p=";
	const _urlHost = "https://steamcommunity.com/";
	
	
	jQuery.read__lang = function(){
		
		let hdLang = document.getElementsByTagName("html")[0].getAttribute("lang");
		
		if(hdLang == hdLanguages.English){
			
			hdCurrentLang = 0;
			
		}else if( -1 != hdLang.indexOf(hdLanguages.CN) ){
			hdCurrentLang = 1;
		}
		
		//console.log("current lang " + hdCurrentLang);
	}
	
	jQuery.read__pageIndex = function(){
		
		if( -1 !== hdUrl.indexOf(_urlParam_pageIndex)){
			hdPageIndex = hdUrl.substring(hdUrl.indexOf(_urlParam_pageIndex) + _urlParam_pageIndex.length);

			hdPageIndex = jQuery.trim(hdPageIndex);			
			
		}

		
	}
	
	jQuery.read__userId = function(){

		hdUserId = window.location.pathname.split('/')[2];
		
		hdUserId = jQuery.trim(hdUserId);
		
		hdProfileNo = window.location.pathname.split('/')[2];
		
		hdProfileNo = jQuery.trim(hdProfileNo);		
	}
	
	jQuery.is__urlTypeId = function(){

		return window.location.pathname.indexOf('/id/');

		
	}
	
	jQuery.read__userId();
	jQuery.read__pageIndex();	
	jQuery.read__lang();
	
	
	/**
	*	@desc get data year, month, day from string like '2017年4月11日'
	*   @return return a Array like["2017", "4", "11"]   
	*/
	jQuery.getZhYMD = function(ymd){
		
		let resultYear = ymd.split("年");
		let resultMonth = ymd.split("月");
		let resultDay = ymd.split("日");
		let theYear,theMonth,theDay;
		
		theYear = new Date().getFullYear();
		if(resultYear.length == 2){
			
			theYear = resultYear[0];
			

		}
		
		if(resultYear.length == 1){
			
			theMonth = resultMonth[0];

		}else{
			theMonth = resultYear[1].split("月")[0];
		}
		
		theDay = resultMonth[1].slice(0, -1);		
		
		
		return [theYear, theMonth, theDay];
	}	
	
	
	/**
	*	@desc get standard time data from Steam display format like 'Posted December 5, 2015.	Last edited October 15, 2017.', 'Posted October 1, 2017.'...
	*         include i18n (zh-CN:"发布于 2017年7月15日。")
	*   @return Date string
	*/
	jQuery.formatTimeHD = function(source){
		
		let resultTime = new Date().toString();
		
		if (typeof source !== 'string' && !(source instanceof String)){

			return resultTime;
			
		}
		
		let src = jQuery.trim(source);
		
		let subFmt2001 = function(time){
			
			if (typeof time !== "undefined" && time instanceof Date) {
				if (time.getFullYear() == "2001"){
					time.setFullYear(new Date().getFullYear());
				}	
			}
		}
		
		//necessary to Firefox, FF cannot parse from the format like '18 March'
		let subFmtFirefox = function(time){
			
			let tempDate = time;
			
			if((isNaN( new Date(tempDate).getTime() ))){
				
				tempDate+=("," + new Date().getFullYear());
				
			}	
			
			return tempDate;
		}
		
		if ( src != ''  ) {
			
			let tempDate = resultTime;
			//case posted
			if ( -1 == src.indexOf(_edited[hdCurrentLang])){
				
				switch(hdCurrentLang){
					
					case 1:
						tempDate = new Date(jQuery.getZhYMD(src.substring(_posted[hdCurrentLang].length + 1).slice(0, -1)));
						break;
						
					default:
						tempDate = src.substring(_posted[hdCurrentLang].length + 1).slice(0, -1);
						
						tempDate = new Date(subFmtFirefox(tempDate));
						
						break;
					
				}
				
				subFmt2001(tempDate);
				resultTime = tempDate.toString();
			}
			else{
				//case after edited
				
				tempDate = src.substring(src.indexOf(_last_edited[hdCurrentLang]) + _last_edited[hdCurrentLang].length + 1).slice(0, -1);
				
				switch(hdCurrentLang){
					
					case 1:
						tempDate = new Date(jQuery.getZhYMD(tempDate));

						break;
					default:
						tempDate = new Date(subFmtFirefox(tempDate));
					
						break;
				}
				
				subFmt2001(tempDate);
				resultTime = tempDate.toString();		
			}
		}
		
		return resultTime;
	}
	
	
	/**
	*	@desc every single Ajax request
	*/	
	jQuery.ajaxReviewsByPageIdx = function(pVal){
		
		jQuery.ajax({
		  method: "GET",
		  dataType : 'html',
		  url: _urlHost + ( (jQuery.is__urlTypeId() ) ? "profiles/" + hdProfileNo + "/recommended/" : "id/" + hdUserId + "/recommended/" ) ,
		  data: { p: pVal }
		})
		  .done(function( html ) {

			let stm_postList =  jQuery("#leftContents .review_box", jQuery(html));
			let stm_postTimeList = $(".review_box_content .rightcol .posted", jQuery(html));
			
			if( stm_postList && stm_postList.length > 0){
				hdNodesPostList.push(stm_postList);
				hdNodesTimeList.push(stm_postTimeList);
				hdPostListSuccessFlags[pVal - 1] = true;
			
				
			}
			
			
			//all data be ready
			if( hdPostListSuccessFlags[0] ){
				
				
				
				let allOKFlag = true;
				jQuery.each(hdPostListSuccessFlags, function(i , val){
					
					if(false === val){
						allOKFlag = false;
					}
					
				});
				
				
				//core
				if(allOKFlag){
					
				
					
					//step 1: prepare data(reviews)
					let __prepareEntities = function(){
						jQuery.each(hdNodesPostList, function(i ,  list){

							//console.log(list);
							
							let _timeList = hdNodesTimeList[i];
							
							jQuery.each(list, function(ii , val){
								
								
								
								hdEntities[hdIdx ] = {};
								hdEntities[hdIdx][hdINNERHTML] = val.innerHTML;
								

								let postedTime = jQuery.trim(_timeList[ii].innerHTML);
								
						

								hdEntities[hdIdx][hdPOSTEDTIME] =  jQuery.formatTimeHD(postedTime);
								
								
								
								hdIdx++;
							});						
							
						});							
						
					}
					
					__prepareEntities();

					//console.log(hdEntities.length);
					//step 2: sort by updated time(edited time, posted time)
					let hd_array = hdEntities;
					let __sortByUpdTime = function(){
						let hd_getTimestamps = function(date){
							
							if (typeof date === 'string' || date instanceof String){
								
								return new Date(date).getTime();
								
							}
							
							return 0;
						}
						
						for(let m = 0; m < hdEntities.length ; m++ ){
							
							
							
							for(let n = m + 1; n < hdEntities.length ; n ++) {
								if ( hd_getTimestamps(hdEntities[m][hdPOSTEDTIME]) < hd_getTimestamps(hdEntities[n][hdPOSTEDTIME])){
									let hd_temp = hdEntities[m];
									hdEntities[m] = hdEntities[n];
									hdEntities[n] = hd_temp;
								
								} 
							}
						
						
						}
					}
					
					__sortByUpdTime();
					
					//final step: rebuild
					let stm_curPagePostList =  $("#leftContents .review_box");
					let __rebuild = function(){
						let hdEntitiesShowStart = (hdPageIndex - 1) * _steam_showReviewsPerPage;
						let hdEntitiesShowedCount = 0;
						jQuery.each(hdEntities, function(i , val){
								//console.log(val);

								
								if(i >=  hdEntitiesShowStart){
									
										stm_curPagePostList[i - hdEntitiesShowStart].innerHTML = hdEntities[i][hdINNERHTML];
								}

								if(hdEntitiesShowedCount ==  (hdEntitiesShowStart + _steam_showReviewsPerPage - 1)){// (_steam_showReviewsPerPage - 1)){
									
									
									return false;
								}
								
								hdEntitiesShowedCount++;
								
							}
						
						);							
						
					}
					
					__rebuild();
					jQuery.__hideLoading();
					
				}//allOKFlag
				
			}
			//console.log(pVal);
		});		
		
	};
	
	

	//loop request
	(function onLoop (i) {          
	   setTimeout(function () {   
		  //console.log('onLoop ' + i);
		  hdPostListSuccessFlags[i - 1] = false;
		  jQuery.ajaxReviewsByPageIdx(i);
		  if (--i) onLoop(i);
	   }, 66)
	})(hdThePageCount); 
	

	
	let hdLoadingSlogan = "wait";
	
	function htmlToElement(html) {
		let template = document.createElement('template');
		html = html.trim();
		template.innerHTML = html;
		return template.content.firstChild;
	}

	jQuery.__showLoading = function(){
		$('#myLoadingBar').css(
			{
				'display' : 'inline-block',
				'color' : '#FFF'
			}
		);			
		
	};

	jQuery.__hideLoading = function(){
		$('#myLoadingBar').css(
			{
				'display' : 'none'
			}
		);			
		
	};
	
	//use Native DOM API
	let createLoadingBar = function(){
		
		let hdParentLeft = document.getElementById('leftContents');
		
		let hdRefNode = document.getElementsByClassName('workshopBrowsePaging')[0];
		
		let hdElmLoading = htmlToElement('<h2 id="myLoadingBar">wait</h2>');
		
		hdElmLoading = hdParentLeft.insertBefore(hdElmLoading, hdRefNode);		
		
	}
	
	if(!document.getElementById('myLoadingBar')){
		createLoadingBar();
	}
	
	jQuery.__showLoading();
	

	//add a Loading Bar to enhance user experience
	$('#myLoadingBar').text(hdLoadingSlogan);
    function waitingLoop() {
        $('#myLoadingBar').css({'font-size' : '1.1em'});
        $('#myLoadingBar').animate ({
            fontSize : "1.1em",
        }, 300, 'linear', function() {
			
			if($('#myLoadingBar').text().length < (hdLoadingSlogan.length + 4 )){
				
				$('#myLoadingBar').text($('#myLoadingBar').text() + '.');
			}
			else{
				$('#myLoadingBar').text(hdLoadingSlogan);
			}
            waitingLoop();
        });
    }
    waitingLoop();	
	

});	
	
	
})();

