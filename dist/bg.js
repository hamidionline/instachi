function isFunction(t){return!!(t&&t.constructor&&t.call&&t.apply)}function clog(){for(var t in arguments)console.log(arguments[t])}function idGenerator(){var t=function(){return(65536*(1+Math.random())|0).toString(16).substring(1)};return t()+t()+"-"+t()+"-"+t()+"-"+t()+"-"+t()+t()+t()}function updateTask(t,e){chrome.storage.local.get("tasks",function(s){var o={};void 0!==s.tasks&&(o=s.tasks),o[t]=e,chrome.storage.local.set({tasks:o},function(){})})}function postMessage(t,e,s){if(void 0!==s&&isFunction(s)){var o=idGenerator();callbacks[o]=s,e.callbackId=o}t.postMessage(e)}function invokeCallback(t,e){void 0!==callbacks[t]&&(callbacks[t](e),delete callbacks[t])}function getDb(t){if(void 0==t)return null;var e=new Dexie("user_"+t);return e.version(1).stores({tasks:"id,state,status",followHistories:"id,username,status,datetime"}),e.open().catch(function(t){}),e}function persistTask(t,e){if(void 0==t){var s=getDb("all");s.tasks.put(e).catch(function(t){})}else void 0!==tabs[t]&&tabs[t].postMessage({action:"getCurrentUser"},function(t){if(t.result){var s=getDb(t.user.id);s.tasks.put(e).catch(function(t){})}})}function hasFollowHistory(t,e,s){var o=getDb(t);o.followHistories.get(e,function(t){s(void 0==t?!1:!0)}).catch(function(t){})}function updateFollowHistory(t,e){void 0!==tabs[t]&&tabs[t].postMessage({action:"getCurrentUser"},function(t){if(t.result){var s=getDb(t.user.id);s.followHistories.get(e.id,function(t){void 0==t?(void 0==e.datetime&&(e.datetime=(new Date).getTime()),s.followHistories.add(e).then(function(){}).catch(function(t){})):(t.status!=e.status?e.datetime=(new Date).getTime():void 0==t.datetime?e.datetime=(new Date).getTime():e.datetime=t.datetime,s.followHistories.put(e).then(function(){}).catch(function(t){}))})}})}function waitUntil(t,e){t()?e():setTimeout(function(){waitUntil(t,e)},100)}function any(t,e){for(var s in t)if(e(t[s]))return!0;return!1}function all(t,e){for(var s in t)if(!e(t[s]))return!1;return!0}function showFollowHistories(t){var e=getDb(t),s=$("#histories");s.children("*").remove();var o=e.followHistories.orderBy("datetime");o.count(function(t){s.append("<div>"+t+"</div>")}),o.toArray(function(t){for(var e in t){var o=t[e];s.append("<div>"+o.id+"  "+o.username+"  "+new Date(o.datetime)+"  "+o.status+";</div>")}})}function update(t){var e=getDb(t);e.followHistories.toArray(function(t){t.length;for(var s in t){var o=t[s],i=Date.parse(o.datetime);isNaN(i)||(o.datetime=i,e.followHistories.put(o).then(function(){}).catch(function(t){}))}})}var tabs={},ports={},popupPort,callbacks={};chrome.runtime.onConnect.addListener(function(t){"popup"==t.name?(popupPort=t,t.onMessage.addListener(function(e){popupCtrl[e.action].apply(popupCtrl,[t,e])})):void 0==tabs[t.sender.tab.id]?tabs[t.sender.tab.id]=new tab(t.sender.tab.id,t):tabs[t.sender.tab.id].setPort(t)}),Zepto(function(){$("#container"),$("#histories");$("#btn-import").on("click",function(){var t=getDb($("#user-id").val()),e=$("#data").val().split(";");for(var s in e){var o=e[s].split(",");t.followHistories.add({id:o[0].toString(),username:o[1],datetime:parseInt(o[2]),status:o[3]}).then(function(){}).catch(function(t){})}}),Dexie.getDatabaseNames(function(t){var e=$("#dbs");for(var s in t){var o=$("<li></li>"),i=$('<a href="#">'+t[s]+"</a>"),n=$('<a href="#"> update </a>');n.on("click",function(t){t.preventDefault();var e=$(this);update(e.data("id").split("_")[1])}).data("id",t[s]),i.on("click",function(t){t.preventDefault();var e=$(this);showFollowHistories(e.data("id").split("_")[1])}).data("id",t[s]),i.appendTo(o),n.appendTo(o),o.appendTo(e)}})});var followTask=function(t){this.id=idGenerator(),this.state=t,this.status="Stop",void 0==this.state.currentStep&&(this.state.users=new Array,this.state.profileViewsCount=0,this.state.followsCount=0,this.state.requestsCount=0,this.state.progress=0,"posts"==this.state.pattern?this.state.currentStep="fetchFollowersFromPosts":"followers"==this.state.pattern&&(this.state.currentStep="fetchFollowersFromList"))};followTask.prototype.persist=function(t){persistTask(void 0,{id:this.id,status:t,state:this.state})},followTask.prototype.start=function(t){this.tab=t,this.tabId=t.id,this.port=t.port,"Start"!=this.status&&(this.status="Start",this[this.state.currentStep]())},followTask.prototype.fetchFollowersFromPosts=function(){this.tab.onConnect($.proxy(function(t){this.state.profileViewsCount++,this.tab.removeOnConnect(),this.forceStop()||(this.pipeline=this.tab.createPipeline($.proxy(function(){this.state.currentStep="followFromFetchedUsers",this.followFromFetchedUsers()},this)),this.pipeline.register("getPosts",{},$.proxy(this.getPostsCycle,this)),this.pipeline.start())},this)),this.tab.postMessage({action:"gotoProfile",username:this.state.username})},followTask.prototype.getPostsCycle=function(t,e){if(!this.forceStop())if(e.result){var s;void 0!==e.response?200==e.response.status&&(s=e.response.data.media):s=e.media;for(var o in s.nodes){var i=s.nodes[o];(i.comments.count>0||i.likes.count>0)&&t.register("openPost",{code:i.code},$.proxy(this.openPostResponse,this))}s.page_info.has_next_page&&t.register("loadMorePosts",{},$.proxy(this.getPostsCycle,this)),t.next()}else t.next()},followTask.prototype.openPostResponse=function(t,e){if(!this.forceStop())if(e.result)if(200==e.response.status){var s=e.response.data.media,o=0;s.likes.nodes.forEach($.proxy(function(t){this.forceStop()||this.state.users.length>=this.state.count||all(this.state.users,function(e){return e.id!=t.user.id})&&(this.state.checkFollowHistory?(o++,hasFollowHistory(this.tab.getViewer().id,t.user.id,$.proxy(function(e){o--,e||(this.state.users.push(t.user),this.state.progress=this.state.users.length/this.state.count*100)},this))):(this.state.users.push(t.user),this.state.progress=this.state.users.length/this.state.count*100))},this)),waitUntil($.proxy(function(){return this.forceStop()||0==o},this),$.proxy(function(){this.forceStop()||(s.comments.nodes.forEach($.proxy(function(t){this.forceStop()||this.state.users.length>=this.state.count||all(this.state.users,function(e){return e.id!=t.user.id})&&(this.state.checkFollowHistory?(o++,hasFollowHistory(this.tab.getViewer().id,t.user.id,$.proxy(function(e){o--,e||(this.state.users.push(t.user),this.state.progress=this.state.users.length/this.state.count*100)},this))):(this.state.users.push(t.user),this.state.progress=this.state.users.length/this.state.count*100))},this)),waitUntil($.proxy(function(){return this.forceStop()||0==o},this),$.proxy(function(){this.forceStop()||(this.state.users.length<this.state.count?(s.comments.page_info.has_previous_page&&t.registerAfter("loadMoreComments",{},$.proxy(this.loadMoreCommentsResponse,this)),t.next(1,1)):t.end())},this)))},this))}else t.next();else t.next()},followTask.prototype.loadMoreCommentsResponse=function(t,e){if(!this.forceStop())if(e.result)if(200==e.response.status)if("ok"==e.response.data.status){var s=0,o=e.response.data;o.comments.nodes.forEach($.proxy(function(t){this.forceStop()||this.state.users.length>=this.state.count||all(this.state.users,function(e){return e.id!=t.user.id})&&(this.state.checkFollowHistory?(s++,hasFollowHistory(this.tab.getViewer().id,t.user.id,$.proxy(function(e){s--,e||(this.state.users.push(t.user),this.state.progress=this.state.users.length/this.state.count*100)},this))):(this.state.users.push(t.user),this.state.progress=this.state.users.length/this.state.count*100))},this)),waitUntil($.proxy(function(){return this.forceStop()||0==s},this),$.proxy(function(){this.forceStop()||(this.state.users.length<this.state.count?(o.comments.page_info.has_previous_page&&t.registerAfter("loadMoreComments",{},$.proxy(this.loadMoreCommentsResponse,this)),t.next(1,1)):t.end())},this))}else t.next();else t.next();else t.next()},followTask.prototype.followFromFetchedUsers=function(){this.state.progress=0,this.forceStop()||(this.pipeline=this.tab.createPipeline($.proxy(function(){this.completed(this)},this)),this.state.users.forEach($.proxy(function(t){this.forceStop()||this.pipeline.register($.proxy(function(){this.forceStop()||(this.state.currentUser=t,this.tab.onConnect($.proxy(function(){this.state.profileViewsCount++,this.tab.removeOnConnect(),this.pipeline.port=this.tab.port,this.pipeline.next()},this)),this.pipeline.next())},this)).register("gotoProfile",{username:t.username}).register("getProfileInfo",{},$.proxy(this.getProfileInfoResponse,this)).register("followFromPage",{username:t.username,userId:t.id},$.proxy(this.followFromProfileResponse,this))},this)),this.pipeline.start())},followTask.prototype.getProfileInfoResponse=function(t,e){if(this.state.progress=t.index/t.steps.length*100,e.result)if(e.user.followed_by_viewer||e.user.requested_by_viewer){var s=e.user.followed_by_viewer?"following":"requested";updateFollowHistory(this.tabId,{id:e.user.id,username:e.user.username,status:s}),t.next(2)}else t.next();else updateFollowHistory(this.tabId,{id:this.state.currentUser.id,username:this.state.currentUser.username,status:"block"}),t.next(2)},followTask.prototype.followFromProfileResponse=function(t,e){if(e.result)if(200==e.response.status){if("ok"==e.response.data.status){"following"==e.response.data.result?this.state.followsCount++:this.state.requestsCount++;var s=t.getCurrentStep().args;updateFollowHistory(this.tabId,{id:s.userId,username:s.username,status:e.response.data.result,datetime:(new Date).getTime()}),t.next(1,1)}}else{var o=Math.floor(6*Math.random())+5,i=new Date;i.setSeconds(i.getSeconds()+60*o),this.state.waitUntil=i,setTimeout($.proxy(this.endWaiting,this),60*o*1e3),t.previous(3,60*o)}else t.next()},followTask.prototype.endWaiting=function(){this.state.waitUntil=void 0},followTask.prototype.fetchFollowersFromList=function(){this.forceStop()||(this.tab.onConnect($.proxy(function(){this.tab.removeOnConnect(),this.forceStop()||(this.pipeline=this.tab.createPipeline($.proxy(function(){this.state.currentStep="followFromFetchedUsers",this.followFromFetchedUsers()},this)),this.state.currentPage=1,this.pipeline.register("openFollowers",{},$.proxy(this.fetchFollowersFromListCycle,this)).start())},this)),this.tab.postMessage({action:"gotoProfile",username:this.state.username}))},followTask.prototype.fetchFollowersFromListCycle=function(t,e){if(!this.forceStop())if(e.result)if(200==e.response.status){var s=e.response.data;if("ok"==s.status){var o=0;s.followed_by.nodes.forEach($.proxy(function(t){this.forceStop()||this.state.users.length>=this.state.count||t.requested_by_viewer||t.followed_by_viewer||(this.state.checkFollowHistory?(o++,hasFollowHistory(this.tab.getViewer().id,t.id,$.proxy(function(e){o--,e||(this.state.users.push(t),this.state.progress=this.state.users.length/this.state.count*100)},this))):(this.state.users.push(t),this.state.progress=this.state.users.length/this.state.count*100))},this)),waitUntil($.proxy(function(){return this.forceStop()||0==o},this),$.proxy(function(){this.forceStop()||(this.state.users.length<this.state.count&&s.followed_by.page_info.has_next_page?(t.register("loadMoreFollowers",{},$.proxy(this.fetchFollowersFromListCycle,this)),t.next()):t.end())},this))}else t.next()}else t.next();else t.next()},followTask.prototype.getStatus=function(){var t;switch(this.state.currentStep){case"fetchFollowersFromPosts":t="استخراج کاربران از پست ها";break;case"fetchFollowersFromList":t="استخراج کاربران از لیست فالورها";break;case"fetchFollowersFromHashtag":t="استخراج کاربران از پست های هشتگ";break;case"followFromFetchedUsers":t="فالوکردن کاربران"}return{type:"فالو",progress:this.state.progress>100?100:Math.floor(this.state.progress),step:t,waitUntil:void 0!=this.state.waitUntil?this.state.waitUntil.toISOString():void 0,states:[{name:"کاربران استخراج شده",value:this.state.users.length},{name:"صفحات باز شده",value:this.state.profileViewsCount},{name:"کاربران فالو شده",value:this.state.followsCount},{name:"درخواست های فالو",value:this.state.requestsCount}]}},followTask.prototype.completed=function(){},followTask.prototype.forceStop=function(){return this.stopSignal},followTask.prototype.stop=function(){this.stopSignal=!0,void 0!=this.pipeline&&this.pipeline.stop()};var pipeline=function(t,e){this.steps=new Array,this.index=0,this.port=t,this.onCompleted=e,this.forceStop=!1};pipeline.prototype.register=function(t,e,s){return isFunction(t)?this.steps.push({callback:t,args:e,type:"fn"}):(e=e||{},e.action=t,this.steps.push({args:e,callback:s,type:"page"})),this},pipeline.prototype.registerAfter=function(t,e,s){return isFunction(t)?this.steps.splice(this.index+1,0,{callback:t,args:e,type:"fn"}):(e=e||{},e.action=t,this.steps.splice(this.index+1,0,{args:e,callback:s,type:"page"})),this},pipeline.prototype.start=function(){if(!this.forceStop)return this.index=-1,this.startTime=new Date,this.status="Started",this.next()},pipeline.prototype.next=function(t,e){if(!this.forceStop)if(void 0==e){if("Started"!=this.status)return;if(t=t||1,this.index+=t,this.index<this.steps.length){var s=this.steps[this.index];"page"==s.type?postMessage(this.port,s.args,$.proxy(function(t){s.callback(this,t)},this)):s.callback(s.args)}else this.completed("Completed")}else this.timeoutId=setTimeout($.proxy(function(){delete this.timeoutId,this.next(t)},this),1e3*e)},pipeline.prototype.previous=function(t,e){if(!this.forceStop)if(void 0==e){if("Started"!=this.status)return;if(t=t||1,this.index-=t,this.index>-1){var s=this.steps[this.index];"page"==s.type?postMessage(this.port,s.args,$.proxy(function(t){s.callback(this,t)},this)):s.callback(s.args)}else this.completed("Completed")}else this.timeoutId=setTimeout($.proxy(function(){delete this.timeoutId,this.previous(t)},this),1e3*e)},pipeline.prototype.end=function(){this.completed("Stoped")},pipeline.prototype.completed=function(t){this.status=t,void 0!==this.onCompleted&&this.onCompleted()},pipeline.prototype.getCurrentStep=function(){return this.steps[this.index]},pipeline.prototype.retry=function(t){this.forceStop||(t=t||.1,this.timeoutId=setTimeout($.proxy(function(){if(delete this.timeoutId,!this.forceStop&&"Started"==this.status){var t=this.steps[this.index];postMessage(this.port,t.args,$.proxy(function(e){t.callback(this,e)},this))}},this),1e3*t))},pipeline.prototype.stop=function(){this.forceStop=!0,void 0!=this.timeoutId&&clearTimeout(this.timeoutId)};var popupCtrl={activationStatus:function(t,e){t.postMessage({action:"callback.activationStatus",result:!0})},loginStatus:function(t,e){t.postMessage({action:"callback.loginStatus",result:!0})},createTask:function(t,e){var s=taskService.create(e);t.postMessage({action:"callback.createTask",result:s})},getCurrentPage:function(t,e){chrome.tabs.query({active:!0,currentWindow:!0},function(e){e.length>0?tabs[e[0].id].postMessage({action:"getCurrentPage"},function(e){t.postMessage({action:"callback.getCurrentPage",result:e.result,username:e.username})}):t.postMessage({action:"callback.getCurrentPage",result:!1})})},getCurrentTask:function(t,e){chrome.tabs.query({active:!0,currentWindow:!0},function(e){e.length>0&&void 0!=tabs[e[0].id].task?t.postMessage({action:"callback.getCurrentTask",result:!0,task:tabs[e[0].id].task.getStatus()}):t.postMessage({action:"callback.getCurrentTask",result:!1})})},stopTask:function(t,e){chrome.tabs.query({active:!0,currentWindow:!0},function(e){e.length>0&&void 0!=tabs[e[0].id].task?(taskService.stop(tabs[e[0].id].task),t.postMessage({action:"callback.stopTask",result:!0})):t.postMessage({action:"callback.stopTask",result:!1})})},getFollowingsCount:function(t,e){chrome.tabs.query({active:!0,currentWindow:!0},function(e){if(e.length>0)if(void 0!==tabs[e[0].id]){var s=tabs[e[0].id].getViewer();if(null!=s){var o=getDb(s.id);o.followHistories.where("status").equals("following").count(function(e){t.postMessage({action:"callback.getFollowingsCount",result:!0,count:e})}).catch(function(e){t.postMessage({action:"callback.getFollowingsCount",result:!1})})}else t.postMessage({action:"callback.getFollowingsCount",result:!1})}else t.postMessage({action:"callback.getFollowingsCount",result:!1});else t.postMessage({action:"callback.getFollowingsCount",result:!1})})},getRequestsCount:function(t,e){chrome.tabs.query({active:!0,currentWindow:!0},function(e){if(e.length>0)if(void 0!==tabs[e[0].id]){var s=tabs[e[0].id].getViewer();if(null!=s){var o=getDb(s.id);o.followHistories.where("status").equals("requested").count(function(e){t.postMessage({action:"callback.getRequestsCount",result:!0,count:e})}).catch(function(e){t.postMessage({action:"callback.getRequestsCount",result:!1})})}else t.postMessage({action:"callback.getRequestsCount",result:!1})}else t.postMessage({action:"callback.getRequestsCount",result:!1});else t.postMessage({action:"callback.getRequestsCount",result:!1})})}},tab=function(t,e){this.id=t,this.setPort(e)};tab.prototype.onConnect=function(t){void 0!==t&&isFunction(t)?this.onConnectCallback=t:void 0!==this.onConnectCallback&&this.onConnectCallback()},tab.prototype.removeOnConnect=function(){void 0!==this.onConnectCallback&&delete this.onConnectCallback},tab.prototype.setPort=function(t){this.port=t,chrome.pageAction.show(this.id),t.onMessage.addListener(function(t){if(void 0!=t.action&&null!=t.action&&0==t.action.indexOf("callback.")){var e=t.action.split(".")[1];invokeCallback(e,t)}}),t.onDisconnect.addListener(function(t){}),this.postMessage({action:"getSharedData"},$.proxy(function(t){this.onConnect(),t.result&&(this.sharedData=t.sharedData)},this))},tab.prototype.postMessage=function(t,e){postMessage(this.port,t,e)},tab.prototype.createPipeline=function(t){return new pipeline(this.port,t)},tab.prototype.getViewer=function(){return void 0!=this.sharedData&&null!=this.sharedData.config.viewer?this.sharedData.config.viewer:null};var taskService={waitingList:new Array,create:function(t){var e;switch(t.type){case"Follow":e=new followTask(t);break;case"Unfollow":e=new unfollowTask(t)}return void 0!==e&&("auto"==t.startType&&this.run(e),!0)},run:function(t){chrome.tabs.query({active:!0,currentWindow:!0},$.proxy(function(e){if(e.length>0&&void 0!==tabs[e[0].id].task)tabs[e[0].id].task=t,t.completed=$.proxy(this.taskCompleted,this),t.start(tabs[e[0].id]);else{var s=!1;for(var o in tabs)void 0===tabs[o].task&&(tabs[o].task=t,s=!0,t.completed=$.proxy(this.taskCompleted,this),t.start(tabs[o]));s||this.waitingList.push(t.id)}},this))},taskCompleted:function(t){void 0!==tabs[t.tabId]&&delete tabs[t.tabId].task},stop:function(t){t.stop(),this.taskCompleted(t)}},unfollowTask=function(t){this.id=idGenerator(),this.state=t,this.status="Stop",void 0==this.state.currentStep&&(this.state.users=new Array,this.state.unfollowsCount=0,this.state.profileViewsCount=0,this.state.retakeRequestsCount=0,this.state.fetchedUsersCount=0,this.state.progress=0,"auto"==this.state.pattern?this.state.currentStep="fetchFollowHistories":this.state.currentStep="fetchFromFollowings")};unfollowTask.prototype.persist=function(t){persistTask(void 0,{id:this.id,status:t,state:this.state})},unfollowTask.prototype.start=function(t){this.tab=t,this.tabId=t.id,this.port=t.port,"Start"!=this.status&&(this.status="Start",this[this.state.currentStep]())},unfollowTask.prototype.completed=function(){},unfollowTask.prototype.fetchFromFollowings=function(){this.forceStop()||(this.tab.onConnect($.proxy(function(){this.tab.removeOnConnect(),this.forceStop()||(this.pipeline=this.tab.createPipeline($.proxy(function(){this.completed(this)},this)),this.pipeline.register("openFollowings",{},$.proxy(this.fetchFollowingsCycle,this)).start())},this)),this.tab.postMessage({action:"gotoHomePage"}))},unfollowTask.prototype.fetchFollowingsCycle=function(t,e){if(!this.forceStop())if(e.result)if(200==e.response.status){var s=e.response.data;if("ok"==s.status){this.state.fetchedUsersCount+=s.follows.nodes.length,this.state.progress=this.state.fetchedUsersCount/s.follows.count*100;for(var o in s.follows.nodes){var i=s.follows.nodes[o];updateFollowHistory(this.tabId,{id:i.id,username:i.username,status:"following"})}s.follows.page_info.has_next_page?(t.register("loadMoreFollowings",{},$.proxy(this.fetchFollowingsCycle,this)),t.next()):t.end()}else t.next()}else t.next();else t.next()},unfollowTask.prototype.fetchFollowHistories=function(){if(!this.forceStop()){this.pipeline=this.tab.createPipeline($.proxy(function(){this.completed(this)},this));var t=$.proxy(function(t){this.forceStop()||this.pipeline.register($.proxy(function(){this.state.currentUser=t,this.tab.onConnect($.proxy(function(){this.state.profileViewsCount++,this.tab.removeOnConnect(),this.pipeline.port=this.tab.port,this.pipeline.next()},this)),this.pipeline.next()},this)).register("gotoProfile",{username:t.username}).register("getProfileInfo",{},$.proxy(this.getProfileInfoResponse,this)).register("unfollowFromPage",{userId:t.id,username:t.username},$.proxy(this.unfollowFromPageResponse,this))},this);this.tab.postMessage({action:"getCurrentUser"},$.proxy(function(e){if(!this.forceStop())if(e.result){var s=getDb(e.user.id),o=["following"];this.state.checkRequests&&o.push("requested"),s.followHistories.orderBy("datetime").and(function(t){return $.inArray(t.status,o)!=-1}).limit(this.state.count).toArray($.proxy(function(e){if(!this.forceStop()){for(var s in e)t(e[s]);this.pipeline.start()}},this))}else this.pipeline.end()},this))}},unfollowTask.prototype.getProfileInfoResponse=function(t,e){this.state.progress=t.index/t.steps.length*100,e.result?e.user.followed_by_viewer?this.state.checkFollowStatus&&e.user.follows_viewer?("requested"==this.state.currentUser.status&&updateFollowHistory(this.tabId,{id:e.user.id,username:e.user.username,status:"following"}),t.next(2)):(this.state.currentUser.currentState="following",t.next()):e.user.requested_by_viewer?this.state.checkRequests?(this.state.currentUser.currentState="requested",t.next()):t.next(2):(updateFollowHistory(this.tabId,{id:e.user.id,username:e.user.username,status:"rejected"}),t.next(2)):(updateFollowHistory(this.tabId,{id:this.state.currentUser.id,username:this.state.currentUser.username,status:"block"}),t.next(2))},unfollowTask.prototype.unfollowFromPageResponse=function(t,e){if(e.result)if(200==e.response.status)"following"==this.state.currentUser.currentState?this.state.unfollowsCount++:this.state.retakeRequestsCount++,updateFollowHistory(this.tabId,{id:e.user.userId,username:e.user.username,status:"unfollowed"}),t.next(1,1);else{var s=Math.floor(6*Math.random())+5,o=new Date;o.setSeconds(o.getSeconds()+60*s),this.state.waitUntil=o,setTimeout($.proxy(this.endWaiting,this),60*s*1e3),t.previous(3,60*s)}else t.next()},unfollowTask.prototype.endWaiting=function(){this.state.waitUntil=void 0},unfollowTask.prototype.getStatus=function(){var t,e=[];switch(this.state.currentStep){case"fetchFromFollowings":t="استخراج فالوینگ ها",e=[{name:"تعداد کاربر استخراج شده",value:this.state.fetchedUsersCount}];break;case"fetchFollowHistories":t="آنفالو کردن کاربران",e=[{name:"تعداد",value:this.state.count},{name:"صفحات باز شده",value:this.state.profileViewsCount},{name:"کاربران آنفالو شده",value:this.state.unfollowsCount},{name:"درخواست های پس گرفته شده",value:this.state.retakeRequestsCount}]}return{type:"آنفالو",progress:this.state.progress>100?100:Math.floor(this.state.progress),step:t,waitUntil:void 0!=this.state.waitUntil?this.state.waitUntil.toISOString():void 0,states:e}},unfollowTask.prototype.forceStop=function(){return this.stopSignal},unfollowTask.prototype.stop=function(){this.stopSignal=!0,void 0!=this.pipeline&&this.pipeline.stop()};
