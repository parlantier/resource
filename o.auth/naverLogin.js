/*
* Jindo
* @type desktop
* @version 2.11.0
*
* NAVER Corp; JindoJS JavaScript Framework
* http://jindo.dev.naver.com/
*
* Released under the LGPL v2 license
* http://www.gnu.org/licenses/old-licenses/lgpl-2.0.html
*
* Customized: Core,$$,$Agent,$H,$Fn,$Event,$Element,$Json,$Ajax
*/

var nv = window.nv||{};

nv._p_ = {};
nv._p_.nvName = "nv";

!function() {
    if(window[nv._p_.nvName]) {
        var __old_j = window[nv._p_.nvName];
        for(var x in __old_j) {
            nv[x] = __old_j[x];
        }
    }
}();

/**
	@fileOverview polyfill íŒŒì¼
	@name polyfill.js
	@author NAVER Ajax Platform
*/
function _settingPolyfill(target,objectName,methodName,polyfillMethod,force){
    if(force||!target[objectName].prototype[methodName]){
        target[objectName].prototype[methodName] = polyfillMethod;
    }
}

function polyfillArray(global){
    function checkCallback(callback){
        if (typeof callback !== 'function') {
            throw new TypeError("callback is not a function.");
        }
    }
    _settingPolyfill(global,"Array","forEach",function(callback, ctx){
        checkCallback(callback);
        var thisArg = arguments.length >= 2 ? ctx : void 0;
        for(var i = 0, l = this.length; i < l; i++){
            callback.call(thisArg, this[i], i, this);
        }
    });
    _settingPolyfill(global,"Array","every",function(callback, ctx){
        checkCallback(callback);
        var thisArg = arguments.length >= 2 ? ctx : void 0;
        for(var i = 0, l = this.length; i < l; i++){
            if(!callback.call(thisArg, this[i], i, this)) return false;
        }
        return true;
    });
}

if(!window.__isPolyfillTestMode){
    polyfillArray(window);
}

//  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
    Function.prototype.bind = function (target) {
        if (typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        
        var arg = Array.prototype.slice.call(arguments, 1), 
        bind = this, 
        nop = function () {},
        wrap = function () {
            return bind.apply(
                nop.prototype && this instanceof nop && target ? this : target,
                arg.concat(Array.prototype.slice.call(arguments))
            );
        };
        
        nop.prototype = this.prototype;
        wrap.prototype = new nop();
        return wrap;
    };
}

function polyfillTimer(global){
    var agent = global.navigator.userAgent, isIOS = /i(Pad|Phone|Pod)/.test(agent), iOSVersion;
    
    if(isIOS){
        var matchVersion =  agent.match(/OS\s(\d)/);
        if(matchVersion){
            iOSVersion = parseInt(matchVersion[1],10);
        }
    }
    
    var raf = global.requestAnimationFrame || global.webkitRequestAnimationFrame || global.mozRequestAnimationFrame|| global.msRequestAnimationFrame,
        caf = global.cancelAnimationFrame || global.webkitCancelAnimationFrame|| global.mozCancelAnimationFrame|| global.msCancelAnimationFrame;
    
    if(raf&&!caf){
        var keyInfo = {}, oldraf = raf;

        raf = function(callback){
            function wrapCallback(){
                if(keyInfo[key]){
                    callback();
                }
            }
            var key = oldraf(wrapCallback);
            keyInfo[key] = true;
            return key;
        };

        caf = function(key){
            delete keyInfo[key];
        };
        
    } else if(!(raf&&caf)) {
        raf = function(callback) { return global.setTimeout(callback, 16); };
        caf = global.clearTimeout;
    }
    
    global.requestAnimationFrame = raf;
    global.cancelAnimationFrame = caf;
    
    
    // Workaround for iOS6+ devices : requestAnimationFrame not working with scroll event
    if(iOSVersion >= 6){
        global.requestAnimationFrame(function(){});
    }
    
    // for iOS6 - reference to https://gist.github.com/ronkorving/3755461
    if(iOSVersion == 6){
        var timerInfo = {},
            SET_TIMEOUT = "setTimeout",
            CLEAR_TIMEOUT = "clearTimeout",
            SET_INTERVAL = "setInterval",
            CLEAR_INTERVAL = "clearInterval",
            orignal = {
                "setTimeout" : global.setTimeout.bind(global),
                "clearTimeout" : global.clearTimeout.bind(global),
                "setInterval" : global.setInterval.bind(global),
                "clearInterval" : global.clearInterval.bind(global)
            };
        
        [[SET_TIMEOUT,CLEAR_TIMEOUT],[SET_INTERVAL,CLEAR_INTERVAL]].forEach(function(v){
            global[v[0]] = (function(timerName,clearTimerName){
                return function(callback,time){
                    var timer = {
                        "key" : "",
                        "isCall" : false,
                        "timerType" : timerName,
                        "clearType" : clearTimerName,
                        "realCallback" : callback,
                        "callback" : function(){
                            var callback = this.realCallback;
                            callback();
                            if(this.timerType === SET_TIMEOUT){
                                this.isCall = true;
                                 delete timerInfo[this.key];
                            }
                        },
                        "delay" : time,
                        "createdTime" : global.Date.now()
                    };
                    timer.key = orignal[timerName](timer.callback.bind(timer),time);
                    timerInfo[timer.key] = timer;
            
                    return timer.key;
                };
            })(v[0],v[1]);
            
            global[v[1]] = (function(clearTimerName){
                return function(key){
                    if(key&&timerInfo[key]){
                        orignal[clearTimerName](timerInfo[key].key);
                        delete timerInfo[key];
                    }
                };
            })(v[1]);
            
        });
        
        function restoreTimer(){
            var currentTime = global.Date.now();
            var newTimerInfo = {},gap;
            for(var  i in timerInfo){
                var timer = timerInfo[i];
                orignal[timer.clearType](timerInfo[i].key);
                delete timerInfo[i];
                
                if(timer.timerType == SET_TIMEOUT){
                    gap = currentTime - timer.createdTime;
                    timer.delay = (gap >= timer.delay)?0:timer.delay-gap;
                }
                
                if(!timer.isCall){
                    timer.key = orignal[timer.timerType](timer.callback.bind(timer),timer.delay);
                    newTimerInfo[i] = timer;
                }
                
                
            }
            timerInfo = newTimerInfo;
            newTimerInfo = null;
        }
        
        global.addEventListener("scroll",function(e){
            restoreTimer();
        });
    }

    return global;
}

if(!window.__isPolyfillTestMode){
    polyfillTimer(window);
}

//-!namespace.default start!-//
/**
	@fileOverview $() í•¨ìˆ˜, nv.$Jindo() ê°ì²´, nv.$Class() ê°ì²´ë¥¼ ï¿½ï¿½ï¿½ì˜í•œ íŒŒì¼.
	@name core.js
	@author NAVER Ajax Platform
 */
/**
 	agentì˜ dependencyë¥¼ ì—†ì• ê¸° ìœ„í•´ ë³„ë„ë¡œ ì„¤ì •.
	
	@ignore
 **/
nv._p_._j_ag = navigator.userAgent;
nv._p_._JINDO_IS_IE = /(MSIE|Trident)/.test(nv._p_._j_ag);  // IE
nv._p_._JINDO_IS_FF = nv._p_._j_ag.indexOf("Firefox") > -1;  // Firefox
nv._p_._JINDO_IS_OP = nv._p_._j_ag.indexOf("Opera") > -1;  // Presto engine Opera
nv._p_._JINDO_IS_SP = /Version\/[\d\.]+\s(?=Safari)/.test(nv._p_._j_ag);  // Safari
nv._p_._JINDO_IS_CH = /Chrome\/[\d\.]+\sSafari\/[\d\.]+$/.test(nv._p_._j_ag);  // Chrome
nv._p_._JINDO_IS_WK = nv._p_._j_ag.indexOf("WebKit") > -1;
nv._p_._JINDO_IS_MO = /(iPhone|iPod|Mobile|Tizen|Android|Nokia|webOS|BlackBerry|Opera Mobi|Opera Mini)/.test(nv._p_._j_ag);

nv._p_.trim = function(str){
    var sBlank = "\\s|\\t|"+ String.fromCharCode(12288), re = new RegExp(["^(?:", ")+|(?:", ")+$"].join(sBlank), "g");
    return str.replace(re, "");
};
//-!namespace.default end!-//

//-!nv.$Jindo.default start!-//
/**
	nv.$Jindo() ê°ì²´ëŠ” í”„ë ˆìž„ì›Œí¬ì— ëŒ€í•œ ì •ë³´ì™€ ìœ í‹¸ë¦¬í‹° í•¨ìˆ˜ë¥¼ ì œê³µí•œë‹¤.

	@class nv.$Jindo
	@keyword core, ì½”ì–´, $Jindo
 */
/**
	nv.$Jindo() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤. nv.$Jindo() ê°ì²´ëŠ” Jindo í”„ë ˆìž„ì›Œí¬ì— ëŒ€í•œ ì •ë³´ì™€ ìœ í‹¸ë¦¬í‹° í•¨ìˆ˜ë¥¼ ì œê³µí•œë‹¤.
	
	@constructor
	@remark ë‹¤ìŒì€ Jindo í”„ë ˆìž„ì›Œí¬ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ì˜ ì†ì„±ì„ ì„¤ëª…í•œ í‘œì´ë‹¤.<br>
		<h5>Jindo í”„ë ˆìž„ì›Œí¬ ì •ë³´ ê°ì²´ ì†ì„±</h5>
		<table class="tbl_board">
			<caption class="hide">Jindo í”„ë ˆìž„ì›Œí¬ ì •ë³´ ê°ì²´ ì†ì„±</caption>
			<thead>
				<tr>
					<th scope="col" style="width:15%">ì´ë¦„</th>
					<th scope="col" style="width:15%">íƒ€ìž…</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">version</td>
					<td>Number</td>
					<td class="txt">Jindo í”„ë ˆìž„ì›Œí¬ì˜ ë²„ì „ì„ ì €ìž¥í•œë‹¤.</td>
				</tr>
		</table>
 */
nv.$Jindo = function() {
    //-@@$Jindo.default-@@//
    var cl=arguments.callee;
    var cc=cl._cached;

    if (cc) return cc;
    if (!(this instanceof cl)) return new cl();
    if (!cc) cl._cached = this;
};

nv._p_.addExtension = function(sClass,sMethod,fpFunction){
    // if(nv[sClass]){
    if(nv[sClass][sMethod]){
        nv.$Jindo._warn(sClass+"."+sMethod+" was overwrite.");
    }else{
        if(/^x/.test(sMethod)){
            nv[sClass][sMethod] = fpFunction;
        }else{
            nv.$Jindo._warn("The Extension Method("+sClass+"."+sMethod+") must be used with x prefix.");
        }
    }
};
/**
	í˜¸í™˜ ëª¨ë“œë¥¼ ì„¤ì •í•˜ê³  ë°˜í™˜í•˜ëŠ” í•¨ìˆ˜.
	
	@method compatible
	@ignore
	@param {Boolean} bType
	@return {Boolean} [true | false]
 */
nv.$Jindo.compatible = function(){
    return false;
};

/**
	ì˜¤ë¸Œì íŠ¸ë¥¼ mixiní•  ë•Œ ì‚¬ìš©.(sourceì˜ ì†ì„±ì¤‘ ì˜¤ë¸Œì íŠ¸ëŠ” ë„˜ì–´ê°.)
	
	@method mixin
	@static
	@param {Hash} oDestination
	@param {Hash} oSource
	@return {Hash} oNewObject
	@since 2.2.0
	@example
		var oDestination = {
			"foo" :1,
			"test" : function(){}
		};
		var oSource = {
			"bar" :1,
			"obj" : {},
			"test2" : function(){}
		};
		
		var  oNewObject = nv.$Jindo.mixin(oDestination,oSource);
		
		oNewObject == oDestination //false
		
		// oNewObject => {
		// "foo" :1,
		// "test" : function(){},
		//     
		// "bar" :1,
		// "obj" : {},
		// "test2" : function(){}
		// };
 */
nv.$Jindo.mixin = function(oDestination, oSource){
    g_checkVarType(arguments, {
        'obj' : [ 'oDestination:Hash+', 'oSource:Hash+' ]
    },"<static> $Jindo#mixin");

    var oReturn = {};

    for(var i in oDestination){
        oReturn[i] = oDestination[i];
    }

    for (i in oSource) if (oSource.hasOwnProperty(i)&&!nv.$Jindo.isHash(oSource[i])) {
        oReturn[i] = oSource[i];
    }
    return oReturn;
};

nv._p_._objToString = Object.prototype.toString;

nv.$Error = function(sMessage,sMethod){
    this.message = "\tmethod : "+sMethod+"\n\tmessage : "+sMessage;
    this.type = "Jindo Custom Error";
    this.toString = function(){
        return this.message+"\n\t"+this.type;
    };
};

nv.$Except = {
    CANNOT_USE_OPTION:"í•´ë‹¹ ì˜µì…˜ì€ ì‚¬ìš©í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.",
    CANNOT_USE_HEADER:"typeì´ jsonp ë˜ëŠ” ë°ìŠ¤í¬íƒ‘ í™˜ê²½ì—ì„œ CORS í˜¸ì¶œì‹œ XDomainRequest(IE8,9) ê°ì²´ê°€ ì‚¬ìš©ë˜ëŠ” ê²½ìš° headerë©”ì„œë“œëŠ” ì‚¬ìš©í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.",
    PARSE_ERROR:"íŒŒì‹±ì¤‘ ì—ëŸ¬ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.",
    NOT_FOUND_ARGUMENT:"íŒŒë¼ë¯¸í„°ê°€ ì—†ìŠµë‹ˆë‹¤.",
    NOT_STANDARD_QUERY:"cssì…€ë ‰í„°ê°€ ì •ìƒì ì´ì§€ ì•ŠìŠµë‹ˆë‹¤.",
    INVALID_DATE:"ë‚ ì§œ í¬ë©§ì´ ì•„ë‹™ë‹ˆë‹¤.",
    REQUIRE_AJAX:"ê°€ ì—†ìŠµë‹ˆë‹¤.",
    NOT_FOUND_ELEMENT:"ì—˜ë¦¬ë¨¼íŠ¸ê°€ ì—†ìŠµë‹ˆë‹¤.",
    HAS_FUNCTION_FOR_GROUP:"ê·¸ë£¹ìœ¼ë¡œ ì§€ìš°ì§€ ì•ŠëŠ” ê²½ìš° detachí•  í•¨ìˆ˜ê°€ ìžˆì–´ì•¼ í•©ë‹ˆë‹¤.",
    NONE_ELEMENT:"ì— í•´ë‹¹í•˜ëŠ” ì—˜ë¦¬ë¨¼íŠ¸ê°€ ì—†ìŠµë‹ˆë‹¤.",
    NOT_SUPPORT_SELECTOR:"ëŠ” ì§€ì›í•˜ì§€ ì•ŠëŠ” selectorìž…ë‹ˆë‹¤.",
	NOT_SUPPORT_CORS:"í˜„ìž¬ ë¸Œë¼ìš°ì €ëŠ” CORSë¥¼ ì§€ì›í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.",
    NOT_SUPPORT_METHOD:"desktopì—ì„œ ì§€ì›í•˜ì§€ ì•ŠëŠ” ë©”ì„œë“œ ìž…ë‹ˆë‹¤.",
    JSON_MUST_HAVE_ARRAY_HASH:"getë©”ì„œë“œëŠ” jsoníƒ€ìž…ì´ hashë‚˜ arrayíƒ€ìž…ë§Œ ê°€ëŠ¥í•©ë‹ˆë‹¤.",
    MUST_APPEND_DOM : "documentì— ë¶™ì§€ ì•Šì€ ì—˜ë¦¬ë¨¼íŠ¸ë¥¼ ê¸°ì¤€ ì—˜ë¦¬ë¨¼íŠ¸ë¡œ ì‚¬ìš©í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.",
    NOT_USE_CSS : "ëŠ” cssë¥¼ ì‚¬ìš© í• ìˆ˜ ì—†ìŠµë‹ˆë‹¤.",
    NOT_WORK_DOMREADY : "domreadyì´ë²¤íŠ¸ëŠ” iframeì•ˆì—ì„œ ì‚¬ìš©í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.",
    CANNOT_SET_OBJ_PROPERTY : "ì†ì„±ì€ ì˜¤ë¸Œì íŠ¸ìž…ë‹ˆë‹¤.\ní´ëž˜ìŠ¤ ì†ì„±ì´ ì˜¤ë¸Œì íŠ¸ì´ë©´ ëª¨ë“  ì¸ìŠ¤í„´ìŠ¤ê°€ ê³µìœ í•˜ê¸° ë•Œë¬¸ì— ìœ„í—˜í•©ë‹ˆë‹¤.",
    NOT_FOUND_HANDLEBARS : "{{not_found_handlebars}}",
    INVALID_MEDIA_QUERY : "{{invalid_media_query}}"
};

/**
 * @ignore
 */
nv._p_._toArray = function(aArray){
    return Array.prototype.slice.apply(aArray);
};

try{
    Array.prototype.slice.apply(document.documentElement.childNodes);
}catch(e){
    nv._p_._toArray = function(aArray){
        var returnArray = [];
        var leng = aArray.length;
        for ( var i = 0; i < leng; i++ ) {
            returnArray.push( aArray[i] );
        }
        return returnArray;
    };
}


/**
	íŒŒë¼ë¯¸í„°ê°€ Functionì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isFunction
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */

/**
	íŒŒë¼ë¯¸í„°ê°€ Arrayì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isArray
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */

/**
	íŒŒë¼ë¯¸í„°ê°€ Stringì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isString
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */

/**
	íŒŒë¼ë¯¸í„°ê°€ Numericì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isNumeric
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
nv.$Jindo.isNumeric = function(nNum){
    return !isNaN(parseFloat(nNum)) && !nv.$Jindo.isArray(nNum) &&isFinite( nNum );
};
/**
	íŒŒë¼ë¯¸í„°ê°€ Booleanì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isBoolean
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
/**
	íŒŒë¼ë¯¸í„°ê°€ Dateì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isDate
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
/**
	íŒŒë¼ë¯¸í„°ê°€ Regexpì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isRegexp
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
/**
	íŒŒë¼ë¯¸í„°ê°€ Elementì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isElement
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
/**
	íŒŒë¼ë¯¸í„°ê°€ Documentì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isDocument
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
(function(){
    var oType = {"Element" : 1,"Document" : 9};
    for(var i in oType){
        nv.$Jindo["is"+i] = (function(sType,nNodeNumber){
            return function(oObj){
                if(new RegExp(sType).test(nv._p_._objToString.call(oObj))){
                    return true;
                }else if(nv._p_._objToString.call(oObj) == "[object Object]"&&oObj !== null&&oObj !== undefined&&oObj.nodeType==nNodeNumber){
                    return true;
                }
                return false;
            };
        })(i,oType[i]);
    }
    var _$type = ["Function","Array","String","Boolean","Date","RegExp"];
    for(var i = 0, l = _$type.length; i < l ;i++){
        nv.$Jindo["is"+_$type[i]] = (function(type){
            return function(oObj){
                return nv._p_._objToString.call(oObj) == "[object "+type+"]";
            };
        })(_$type[i]);
    }
})();

/**
	íŒŒë¼ë¯¸í„°ê°€ Nodeì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isNode
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
nv.$Jindo.isNode = function(eEle){
    try{
        return !!(eEle&&eEle.nodeType);
    }catch(e){
        return false;
    }
};

/**
	íŒŒë¼ë¯¸í„°ê°€ Hashì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isHash
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
nv.$Jindo.isHash = function(oObj){
    return nv._p_._objToString.call(oObj) == "[object Object]"&&oObj !== null&&oObj !== undefined&&!!!oObj.nodeType&&!nv.$Jindo.isWindow(oObj);
};

/**
	íŒŒë¼ë¯¸í„°ê°€ Nullì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isNull
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
nv.$Jindo.isNull = function(oObj){
    return oObj === null;
};
/**
	íŒŒë¼ë¯¸í„°ê°€ Undefinedì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isUndefined
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
nv.$Jindo.isUndefined = function(oObj){
    return oObj === undefined;
};

/**
	íŒŒë¼ë¯¸í„°ê°€ Windowì¸ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
	
	@method isWindow
	@static
	@param {Variant} oObj
	@return {Boolean} [true | false]
	@since 2.0.0
 */
nv.$Jindo.isWindow = function(oObj){
    return oObj && (oObj == window.top || oObj == oObj.window);
};
/**
 * @ignore
 */
nv.$Jindo.Break = function(){
    if (!(this instanceof arguments.callee)) throw new arguments.callee;
};
/**
 * @ignore
 */
nv.$Jindo.Continue = function(){
    if (!(this instanceof arguments.callee)) throw new arguments.callee;
};

/**
	í•¨ìˆ˜ íŒŒë¼ë¯¸í„°ê°€ ì›í•˜ëŠ” ê·œì¹™ì— ë§žëŠ”ì§€ ê²€ì‚¬í•œë‹¤.
	
	@method checkVarType
	@ignore
	@param {Array} aArgs íŒŒë¼ë¯¸í„° ëª©ë¡
	@param {Hash} oRules ê·œì¹™ ëª©ë¡
	@param {String} sFuncName ì—ëŸ¬ë©”ì‹œì§€ë¥¼ ë³´ì—¬ì¤„ë•Œ ì‚¬ìš©í•  í•¨ìˆ˜ëª…
	@return {Object}
 */
nv.$Jindo._F = function(sKeyType) {
    return sKeyType;
};

nv.$Jindo._warn = function(sMessage){
    window.console && ( (console.warn && console.warn(sMessage), true) || (console.log && console.log(sMessage), true) );
};

nv.$Jindo._maxWarn = function(nCurrentLength, nMaxLength, sMessage) {
    if(nCurrentLength > nMaxLength) {
        nv.$Jindo._warn('ì¶”ê°€ì ì¸ íŒŒë¼ë¯¸í„°ê°€ ìžˆìŠµë‹ˆë‹¤. : '+sMessage);
    }
};

nv.$Jindo.checkVarType = function(aArgs, oRules, sFuncName) {
    var sFuncName = sFuncName || aArgs.callee.name || 'anonymous';
    var $Jindo = nv.$Jindo;
    var bCompat = $Jindo.compatible();

    var fpChecker = aArgs.callee['_checkVarType_' + bCompat];
    if (fpChecker) { return fpChecker(aArgs, oRules, sFuncName); }

    var aPrependCode = [];
    aPrependCode.push('var nArgsLen = aArgs.length;');
    aPrependCode.push('var $Jindo = '+nv._p_.nvName+'.$Jindo;');

    if(bCompat) {
        aPrependCode.push('var nMatchScore;');
        aPrependCode.push('var nMaxMatchScore = -1;');
        aPrependCode.push('var oFinalRet = null;');
    }

    var aBodyCode = [];
    var nMaxRuleLen = 0;

    for(var sType in oRules) if (oRules.hasOwnProperty(sType)) {
        nMaxRuleLen = Math.max(oRules[sType].length, nMaxRuleLen);
    }

    for(var sType in oRules) if (oRules.hasOwnProperty(sType)) {
        var aRule = oRules[sType];
        var nRuleLen = aRule.length;

        var aBodyPrependCode = [];
        var aBodyIfCode = [];
        var aBodyThenCode = [];

        if(!bCompat) {
            if (nRuleLen < nMaxRuleLen) { aBodyIfCode.push('nArgsLen === ' + nRuleLen); }
            else { aBodyIfCode.push('nArgsLen >= ' + nRuleLen); }
        }

        aBodyThenCode.push('var oRet = new $Jindo._varTypeRetObj();');

        var nTypeCount = nRuleLen;

        for (var i = 0; i < nRuleLen; ++i) {
            /^([^:]+):([^\+]*)(\+?)$/.test(aRule[i]);

            var sVarName = RegExp.$1,
                sVarType = RegExp.$2,
                bAutoCast = RegExp.$3 ? true : false;

            // if accept any type
            if (sVarType === 'Variant') {
                if (bCompat) {
                    aBodyIfCode.push(i + ' in aArgs');
                }

                aBodyThenCode.push('oRet["' + sVarName + '"] = aArgs[' + i + '];');
                nTypeCount--;

            // user defined type only
            } else if ($Jindo._varTypeList[sVarType]) {
                var vVar = 'tmp' + sVarType + '_' + i;

                aBodyPrependCode.push('var ' + vVar + ' = $Jindo._varTypeList.' + sVarType + '(aArgs[' + i + '], ' + bAutoCast + ');');
                aBodyIfCode.push(vVar + ' !== '+nv._p_.nvName+'.$Jindo.VARTYPE_NOT_MATCHED');
                aBodyThenCode.push('oRet["' + sVarName + '"] = ' + vVar + ';');

            // Jiindo wrapped type
            } else if (/^\$/.test(sVarType) && nv[sVarType]) {
                var sOR = '', sNativeVarType;

                if (bAutoCast) {
                    sNativeVarType = ({ $Fn : 'Function', $S : 'String', $A : 'Array', $H : 'Hash', $ElementList : 'Array' })[sVarType] || sVarType.replace(/^\$/, '');
                    if (nv.$Jindo['is' + sNativeVarType]) {
                        sOR = ' || $Jindo.is' + sNativeVarType + '(vNativeArg_' + i + ')';
                    }
                }

                aBodyIfCode.push('(aArgs[' + i + '] instanceof '+nv._p_.nvName+'.' + sVarType + sOR + ')');
                aBodyThenCode.push('oRet["' + sVarName + '"] = '+nv._p_.nvName+'.' + sVarType + '(aArgs[' + i + ']);');

            // any native type
            } else if (nv.$Jindo['is' + sVarType]) {
                var sOR = '', sWrapedVarType;

                if (bAutoCast) {
                    sWrapedVarType = ({ 'Function' : '$Fn', 'String' : '$S', 'Array' : '$A', 'Hash' : '$H' })[sVarType] || '$' + sVarType;
                    if (nv[sWrapedVarType]) {
                        sOR = ' || aArgs[' + i + '] instanceof '+nv._p_.nvName+'.' + sWrapedVarType;
                    }
                }

                aBodyIfCode.push('($Jindo.is' + sVarType + '(aArgs[' + i + '])' + sOR + ')');
                aBodyThenCode.push('oRet["' + sVarName + '"] = vNativeArg_' + i + ';');

            // type which doesn't exist
            } else {
                throw new Error('VarType(' + sVarType + ') Not Found');
            }
        }

        aBodyThenCode.push('oRet.__type = "' + sType + '";');

        if (bCompat) {
            aBodyThenCode.push('nMatchScore = ' + (nRuleLen * 1000 + nTypeCount * 10) + ' + (nArgsLen === ' + nRuleLen + ' ? 1 : 0);');
            aBodyThenCode.push('if (nMatchScore > nMaxMatchScore) {');
            aBodyThenCode.push('    nMaxMatchScore = nMatchScore;');
            aBodyThenCode.push('    oFinalRet = oRet;');
            aBodyThenCode.push('}');
        } else {
            aBodyThenCode.push('return oRet;');
        }

        aBodyCode.push(aBodyPrependCode.join('\n'));

        if (aBodyIfCode.length) { aBodyCode.push('if (' + aBodyIfCode.join(' && ') + ') {'); }
        aBodyCode.push(aBodyThenCode.join('\n'));
        if (aBodyIfCode.length) { aBodyCode.push('}'); }

    }

    aPrependCode.push(' $Jindo._maxWarn(nArgsLen,'+nMaxRuleLen+',"'+sFuncName+'");');

    for (var i = 0; i < nMaxRuleLen; ++i) {
        var sArg = 'aArgs[' + i + ']';
        aPrependCode.push([ 'var vNativeArg_', i, ' = ', sArg, ' && ', sArg, '.$value ? ', sArg, '.$value() : ', sArg + ';' ].join(''));
    }

    if (!bCompat) {
        aBodyCode.push('$Jindo.checkVarType._throwException(aArgs, oRules, sFuncName);');
    }

    aBodyCode.push('return oFinalRet;');

    // if (bCompat) { console.log(aPrependCode.join('\n') + aBodyCode.join('\n')); }
    aArgs.callee['_checkVarType_' + bCompat] = fpChecker = new Function('aArgs,oRules,sFuncName', aPrependCode.join('\n') + aBodyCode.join('\n'));
    return fpChecker(aArgs, oRules, sFuncName);

};

var g_checkVarType = nv.$Jindo.checkVarType;

// type check return type object
nv.$Jindo._varTypeRetObj = function() {};
nv.$Jindo._varTypeRetObj.prototype.toString = function(){ return this.__type; };

nv.$Jindo.checkVarType._throwException = function(aArgs, oRules, sFuncName) {
    var fpGetType = function(vArg) {

        for (var sKey in nv) if (nv.hasOwnProperty(sKey)) {
            var oConstructor = nv[sKey];
            if (typeof oConstructor !== 'function') { continue; }
            if (vArg instanceof oConstructor) { return sKey; }
        }

        var $Jindo = nv.$Jindo;

        for (var sKey in $Jindo) if ($Jindo.hasOwnProperty(sKey)) {
            if (!/^is(.+)$/.test(sKey)) { continue; }
            var sType = RegExp.$1;
            var fpMethod = $Jindo[sKey];
            if (fpMethod(vArg)) { return sType; }
        }

        return 'Unknown';

    };

    var fpErrorMessage = function(sUsed, aSuggs, sURL) {

        var aMsg = [ 'ìž˜ëª»ëœ íŒŒë¼ë¯¸í„°ìž…ë‹ˆë‹¤.', '' ];

        if (sUsed) {
            aMsg.push('í˜¸ì¶œí•œ í˜•íƒœ :');
            aMsg.push('\t' + sUsed);
            aMsg.push('');
        }

        if (aSuggs.length) {
            aMsg.push('ì‚¬ìš© ê°€ëŠ¥í•œ í˜•íƒœ :');
            for (var i = 0, nLen = aSuggs.length; i < nLen; i++) {
                aMsg.push('\t' + aSuggs[i]);
            }
            aMsg.push('');
        }

        if (sURL) {
            aMsg.push('ë§¤ë‰´ì–¼ íŽ˜ì´ì§€ :');
            aMsg.push('\t' + sURL);
            aMsg.push('');
        }

        aMsg.unshift();

        return aMsg.join('\n');

    };

    var aArgName = [];

    for (var i = 0, ic = aArgs.length; i < ic; ++i) {
        try { aArgName.push(fpGetType(aArgs[i])); }
        catch(e) { aArgName.push('Unknown'); }
    }

    var sUsed = sFuncName + '(' + aArgName.join(', ') + ')';
    var aSuggs = [];

    for (var sKey in oRules) if (oRules.hasOwnProperty(sKey)) {
        var aRule = oRules[sKey];
        aSuggs.push('' + sFuncName + '(' + aRule.join(', ').replace(/(^|,\s)[^:]+:/g, '$1') + ')');
    }

    var sURL;

    if (/(\$\w+)#(\w+)?/.test(sFuncName)) {
        sURL = 'http://jindo.dev.naver.com/docs/jindo/2.11.0/desktop/ko/classes/jindo.' + encodeURIComponent(RegExp.$1) + '.html' + "#method_"+RegExp.$2;
    }

    throw new TypeError(fpErrorMessage(sUsed, aSuggs, sURL));

};

var _getElementById = function(doc,id){
    // Modified because on IE6/7 can be selected elements using getElementById by name
    var docEle = doc.documentElement;
    var sCheckId = "nv"+ (new Date()).getTime();
    var eDiv = doc.createElement("div");
    eDiv.style.display =  "none";
    if(typeof MSApp != "undefined"){
        MSApp.execUnsafeLocalFunction(function(){
            eDiv.innerHTML = "<input type='hidden' name='"+sCheckId+"'/>";
        });
    }else{
        eDiv.innerHTML = "<input type='hidden' name='"+sCheckId+"'/>";
    }
    docEle.insertBefore( eDiv, docEle.firstChild );
    if(doc.getElementById(sCheckId)){
        _getElementById = function(doc,id){
            var eId = doc.getElementById(id);
            if(eId == null) return eId;
            if(eId.attributes['id'] && eId.attributes['id'].value == id){
                return eId;
            }
            var aEl = doc.all[id];
            for(var i=1; i<aEl.length; i++){
                if(aEl[i].attributes['id'] && aEl[i].attributes['id'].value == id){
                    return aEl[i];
                }
            }
        };
    }else{
        _getElementById = function(doc,id){
            return doc.getElementById(id);
        };
    }

    docEle.removeChild(eDiv);
    return _getElementById(doc,id);
};
/**
	checkVarType ë¥¼ ìˆ˜í–‰í• ë•Œ ì‚¬ìš©í•˜ê³  ìžˆëŠ” íƒ€ìž…ì„ ì–»ëŠ”ë‹¤.
	
	@method varType
	@ignore
	@param {String+} sTypeName íƒ€ìž… ì´ë¦„
	@return {Function} íƒ€ìž…ì„ ê²€ì‚¬í•˜ëŠ” ê·œì¹™ì„ êµ¬í˜„í•˜ëŠ” í•¨ìˆ˜
 */
/**
	checkVarType ë¥¼ ìˆ˜í–‰í• ë•Œ ì‚¬ìš©í•  íƒ€ìž…ì„ ì„¤ì •í•œë‹¤.
	
	@method varType
	@ignore
	@syntax sTypeName, fpFunc
	@syntax oTypeLists
	@param {String+} sTypeName íƒ€ìž… ì´ë¦„
	@param {Function+} fpFunc íƒ€ìž…ì„ ê²€ì‚¬í•˜ëŠ” ê·œì¹™ì„ êµ¬í˜„í•˜ëŠ” í•¨ìˆ˜
	@param {Hash+} oTypeLists íƒ€ìž… ê·œì¹™ì„ ë‹´ì€ ê°ì²´, ì´ ì˜µì…˜ì„ ì‚¬ìš©í•˜ë©´ checkVarType ë¥¼ ìˆ˜í–‰í• ë•Œ ì‚¬ìš©í•  ì—¬ëŸ¬ê°œì˜ íƒ€ìž…ë“¤ì„ í•œë²ˆì— ì„¤ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
 */
nv.$Jindo.varType = function() {

    var oArgs = this.checkVarType(arguments, {
        's4str' : [ 'sTypeName:String+', 'fpFunc:Function+' ],
        's4obj' : [ 'oTypeLists:Hash+' ],
        'g' : [ 'sTypeName:String+' ]
    });

    var sDenyTypeListComma = nv.$Jindo._denyTypeListComma;

    switch (oArgs+"") {
    case 's4str':
        var sTypeNameComma = ',' + oArgs.sTypeName.replace(/\+$/, '') + ',';
        if (sDenyTypeListComma.indexOf(sTypeNameComma) > -1) {
            throw new Error('Not allowed Variable Type');
        }

        this._varTypeList[oArgs.sTypeName] = oArgs.fpFunc;
        return this;

    case 's4obj':
        var oTypeLists = oArgs.oTypeLists, fpFunc;
        for (var sTypeName in oTypeLists) if (oTypeLists.hasOwnProperty(sTypeName)) {
            fpFunc = oTypeLists[sTypeName];
            arguments.callee.call(this, sTypeName, fpFunc);
        }
        return this;

    case 'g':
        return this._varTypeList[oArgs.sTypeName];
    }

};

/**
	varType ì— ë“±ë¡í•œ íƒ€ìž… ì²´í¬ í•¨ìˆ˜ì—ì„œ íƒ€ìž…ì´ ë§¤ì¹­ë˜ì§€ ì•ŠìŒì„ ì•Œë¦¬ê³  ì‹¶ì„ë•Œ ì‚¬ìš©í•œë‹¤.
	
	@constant VARTYPE_NOT_MATCHED
	@static
	@ignore
 */
nv.$Jindo.VARTYPE_NOT_MATCHED = {};

(function() {

    var oVarTypeList = nv.$Jindo._varTypeList = {};
    var cache = nv.$Jindo;
    var ___notMatched = cache.VARTYPE_NOT_MATCHED;
    oVarTypeList['Numeric'] = function(v) {
        if (cache.isNumeric(v)) { return v * 1; }
        return ___notMatched;
    };

    oVarTypeList['Hash'] = function(val, bAutoCast){
        if (bAutoCast && nv.$H && val instanceof nv.$H) {
            return val.$value();
        } else if (cache.isHash(val)) {
            return val;
        }
        return ___notMatched;
    };

    oVarTypeList['$Class'] = function(val, bAutoCast){
        if ((!cache.isFunction(val))||!val.extend) {
            return ___notMatched;
        }
        return val;
    };

    var aDenyTypeList = [];

    for (var sTypeName in cache) if (cache.hasOwnProperty(sTypeName)) {
        if (/^is(.+)$/.test(sTypeName)) { aDenyTypeList.push(RegExp.$1); }
    }

    cache._denyTypeListComma = aDenyTypeList.join(',');

    cache.varType("ArrayStyle",function(val, bAutoCast){
        if(!val) { return ___notMatched; }
        if (
            /(Arguments|NodeList|HTMLCollection|global|Window)/.test(nv._p_._objToString.call(val)) ||
            /Object/.test(nv._p_._objToString.call(val))&&cache.isNumeric(val.length)) {
            return nv._p_._toArray(val);
        }
        return ___notMatched;
    });

    cache.varType("Form",function(val, bAutoCast){
        if(!val) { return ___notMatched; }
        if(bAutoCast&&val.$value){
            val = val.$value();
        }
        if (val.tagName&&val.tagName.toUpperCase()=="FORM") {
            return val;
        }
        return ___notMatched;
    });
})();

nv._p_._createEle = function(sParentTag,sHTML,oDoc,bWantParent){
    //-@@_createEle.hidden-@@//
    var sId = 'R' + new Date().getTime() + parseInt(Math.random() * 100000,10);

    var oDummy = oDoc.createElement("div");
    switch (sParentTag) {
        case 'select':
        case 'table':
        case 'dl':
        case 'ul':
        case 'fieldset':
        case 'audio':
            oDummy.innerHTML = '<' + sParentTag + ' class="' + sId + '">' + sHTML + '</' + sParentTag + '>';
            break;
        case 'thead':
        case 'tbody':
        case 'col':
            oDummy.innerHTML = '<table><' + sParentTag + ' class="' + sId + '">' + sHTML + '</' + sParentTag + '></table>';
            break;
        case 'tr':
            oDummy.innerHTML = '<table><tbody><tr class="' + sId + '">' + sHTML + '</tr></tbody></table>';
            break;
        default:
            oDummy.innerHTML = '<div class="' + sId + '">' + sHTML + '</div>';
    }
    var oFound;
    for (oFound = oDummy.firstChild; oFound; oFound = oFound.firstChild){
        if (oFound.className==sId) break;
    }

    return bWantParent? oFound : oFound.childNodes;
};

//-!nv.$Jindo.default end!-//

/**
	Built-In Namespace _global_
	
	@class nv
	@static
 */
//-!nv.$ start!-//
/**
	$() í•¨ìˆ˜ëŠ” íŠ¹ì • ìš”ì†Œë¥¼ ìƒì„±í•œë‹¤. "&lt;tagName&gt;" ê³¼ ê°™ì€ í˜•ì‹ì˜ ë¬¸ìžì—´ì„ ìž…ë ¥í•˜ë©´ tagName ìš”ì†Œë¥¼ ê°€ì§€ëŠ” ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.
	
	@method $
	@param {String+} elDomElement ìƒì„±ë  DOM ìš”ì†Œ
	@return {Variant} ìš”ì†Œë¥¼ ìƒì„±í•˜ê³  ê°ì²´(Object) í˜•íƒœë¡œ ë°˜í™˜í•œë‹¤.
	@throws {nv.$Except.NOT_FOUND_ARGUMENT} íŒŒë¼ë¯¸í„°ê°€ ì—†ì„ ê²½ìš°.
	@remark Jindo 1.4.6 ë²„ì „ë¶€í„° ë§ˆì§€ë§‰ íŒŒë¼ë¯¸í„°ì— document ìš”ì†Œë¥¼ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@example
		// tagNameê³¼ ê°™ì€ í˜•ì‹ì˜ ë¬¸ìžì—´ì„ ì´ìš©í•˜ì—¬ ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.
		var el = $("<DIV>");
		var els = $("<DIV id='div1'><SPAN>hello</SPAN></DIV>");
		
		// IEëŠ” iframeì— ì¶”ê°€í•  ì—˜ë¦¬ë¨¼íŠ¸ë¥¼ ìƒì„±í•˜ë ¤ê³  í•  ë•ŒëŠ” documentë¥¼ ë°˜ë“œì‹œ ì§€ì •í•´ì•¼ í•œë‹¤.(1.4.6 ë¶€í„° ì§€ì›)
		var els = $("<div>" , iframe.contentWindow.document);
		// ìœ„ì™€ ê°™ì„ ê²½ìš° divíƒœê·¸ê°€ iframe.contentWindow.documentê¸°ì¤€ìœ¼ë¡œ ìƒê¹€.
 */
/**
	$() í•¨ìˆ˜ëŠ” DOMì—ì„œ íŠ¹ì • ìš”ì†Œë¥¼ ì¡°ìž‘í•  ìˆ˜ ìžˆê²Œ ê°€ì ¸ì˜¨ë‹¤. IDë¥¼ ì‚¬ìš©í•˜ì—¬ DOM ìš”ì†Œ(Element)ë¥¼ ê°€ì ¸ì˜¨ë‹¤. íŒŒë¼ë¯¸í„°ë¥¼ ë‘ ê°œ ì´ìƒ ì§€ì •í•˜ë©´ DOM ìš”ì†Œë¥¼ ì›ì†Œë¡œí•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜í•œë‹¤.
	
	@method $
	@param {String+} sID* ê°€ì ¸ì˜¬ ì²«~N ë²ˆì§¸ DOM ìš”ì†Œì˜ ID ë˜ëŠ” ìƒì„±í•  DOM ìš”ì†Œ
	@return {Variant} ID ê°’ìœ¼ë¡œ ì§€ì •í•œ DOM ìš”ì†Œ(Element) í˜¹ì€ DOM ìš”ì†Œë¥¼ ì›ì†Œë¡œ ê°€ì§€ëŠ” ë°°ì—´(Array)ì„ ë°˜í™˜í•œë‹¤. ë§Œì•½ IDì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œê°€ ì—†ìœ¼ë©´ null ê°’ì„ ë°˜í™˜í•œë‹¤.
	@throws {nv.$Except.NOT_FOUND_ARGUMENT} íŒŒë¼ë¯¸í„°ê°€ ì—†ì„ ê²½ìš°.
	@remark Jindo 1.4.6 ë²„ì „ë¶€í„° ë§ˆì§€ë§‰ íŒŒë¼ë¯¸í„°ì— document ìš”ì†Œë¥¼ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@example
		// IDë¥¼ ì´ìš©í•˜ì—¬ ê°ì²´ë¥¼ ë¦¬í„´í•œë‹¤.
		<div id="div1"></div>
		
		var el = $("div1");
		
		// IDë¥¼ ì´ìš©í•˜ì—¬ ì—¬ëŸ¬ê°œì˜ ê°ì²´ë¥¼ ë¦¬í„´í•œë‹¤.
		<div id="div1"></div>
		<div id="div2"></div>
		
		var els = $("div1","div2"); // [$("div1"),$("div2")]ì™€ ê°™ì€ ê²°ê³¼ë¥¼ ë¦¬í„´í•œë‹¤.
 */
nv.$ = function(sID/*, id1, id2*/) {
    //-@@$-@@//

    if(!arguments.length) throw new nv.$Error(nv.$Except.NOT_FOUND_ARGUMENT,"$");

    var ret = [], arg = arguments, nArgLeng = arg.length, lastArgument = arg[nArgLeng-1],doc = document,el  = null;
    var reg = /^<([a-z]+|h[1-5])>$/i;
    var reg2 = /^<([a-z]+|h[1-5])(\s+[^>]+)?>/i;
    if (nArgLeng > 1 && typeof lastArgument != "string" && lastArgument.body) {
        /*
         ë§ˆì§€ë§‰ ì¸ìžê°€ documentì¼ë•Œ.
         */
        arg = Array.prototype.slice.apply(arg,[0,nArgLeng-1]);
        doc = lastArgument;
    }

    for(var i=0; i < nArgLeng; i++) {
        el = arg[i] && arg[i].$value ? arg[i].$value() : arg[i];
        if (nv.$Jindo.isString(el)||nv.$Jindo.isNumeric(el)) {
            el += "";
            el = el.replace(/^\s+|\s+$/g, "");
            el = el.replace(/<!--(.|\n)*?-->/g, "");

            if (el.indexOf("<")>-1) {
                if(reg.test(el)) {
                    el = doc.createElement(RegExp.$1);
                } else if (reg2.test(el)) {
                    var p = { thead:'table', tbody:'table', tr:'tbody', td:'tr', dt:'dl', dd:'dl', li:'ul', legend:'fieldset',option:"select" ,source:"audio"};
                    var tag = RegExp.$1.toLowerCase();
                    var ele = nv._p_._createEle(p[tag],el,doc);

                    for(var i=0,leng = ele.length; i < leng ; i++) {
                        ret.push(ele[i]);
                    }

                    el = null;
                }
            }else {
                el = _getElementById(doc,el);
            }
        }
        if (el&&el.nodeType) ret[ret.length] = el;
    }
    return ret.length>1?ret:(ret[0] || null);
};

//-!nv.$ end!-//


//-!nv.$Class start!-//
/**
	nv.$Class() ê°ì²´ëŠ” Jindo í”„ë ˆìž„ì›Œí¬ë¥¼ ì‚¬ìš©í•˜ì—¬ ê°ì²´ ì§€í–¥ í”„ë¡œê·¸ëž˜ë° ë°©ì‹ìœ¼ë¡œ ì• í”Œë¦¬ì¼€ì´ì…˜ì„ êµ¬í˜„í•  ìˆ˜ ìžˆë„ë¡ ì§€ì›í•œë‹¤.
	
	@class nv.$Class
	@keyword class, í´ëž˜ìŠ¤
 */
/**
	í´ëž˜ìŠ¤(nv.$Class() ê°ì²´)ë¥¼ ìƒì„±í•œë‹¤. íŒŒë¼ë¯¸í„°ë¡œ í´ëž˜ìŠ¤í™”í•  ê°ì²´ë¥¼ ìž…ë ¥í•œë‹¤. í•´ë‹¹ ê°ì²´ì— $init ì´ë¦„ìœ¼ë¡œ ë©”ì„œë“œë¥¼ ë“±ë¡í•˜ë©´ í´ëž˜ìŠ¤ ì¸ìŠ¤í„´ìŠ¤ë¥¼ ìƒì„±í•˜ëŠ” ìƒì„±ìž í•¨ìˆ˜ë¥¼ ì •ì˜í•  ìˆ˜ ìžˆë‹¤. ë˜í•œ  í‚¤ì›Œë“œë¥¼ ì‚¬ìš©í•˜ë©´ ì¸ìŠ¤í„´ìŠ¤ë¥¼ ìƒì„±í•˜ì§€ ì•Šì•„ë„ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” ë©”ì„œë“œë¥¼ ë“±ë¡í•  ìˆ˜ ìžˆë‹¤.
	
	@constructor
	@param {Hash+} oDef í´ëž˜ìŠ¤ë¥¼ ì •ì˜í•˜ëŠ” ê°ì²´. í´ëž˜ìŠ¤ì˜ ìƒì„±ìž, ì†ì„±, ë©”ì„œë“œ ë“±ì„ ì •ì˜í•œë‹¤.
	@return {nv.$Class} ìƒì„±ëœ í´ëž˜ìŠ¤(nv.$Class() ê°ì²´).
	@example
		var CClass = $Class({
		    prop : null,
		    $init : function() {
		         this.prop = $Ajax();
		         ...
		    },
			$static : {
				static_method : function(){ return 1;}
			}
		});
		
		var c1 = new CClass();
		var c2 = new CClass();
		
		// c1ê³¼ c2ëŠ” ì„œë¡œ ë‹¤ë¥¸ nv.$Ajax() ê°ì²´ë¥¼ ê°ê° ê°€ì§„ë‹¤.
		CClass.static_method(); // 1
 */
/**
	$autoBindì†ì„±ì— trueì„ ë“±ë¡í•˜ë©´ _ê°€ ë“¤ì–´ê°„ ë©”ì„œë“œëŠ” ìžë™ìœ¼ë¡œ bindëœë‹¤.
	
	@property $autoBind
	@type boolean
	@example
		// $autoBind ì˜ˆì œ
		var OnAutoBind = $Class({
			$autoBind : true,
			num : 1,
			each : function(){
				$A([1,1]).forEach(this._check);	
			},
			_check : function(v){
				// this === OnScope ì¸ìŠ¤í„´ìŠ¤
				value_of(v).should_be(this.num);
			}
		});
		
		new OnScope().each();
	@filter desktop
 */
/**
	$staticìœ¼ë¡œ ë“±ë¡ëœ ë©”ì„œë“œëŠ” $Classì„ ì¸ìŠ¤í„´ì„œí™” í•˜ì§€ ì•Šì•„ë„ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	
	@property $static
	@type Object
	@example
		// $static ì˜ˆì œ
		var Static = $Class({
			$static : {
				"do" : function(){
					console.log("static method");
				}
				
			}
		});
		
		Static.do();
		//static method
	@filter desktop
 */
nv.$Class = function(oDef) {
    //-@@$Class-@@//
    var oArgs = g_checkVarType(arguments, {
        '4obj' : [ 'oDef:Hash+' ]
    },"$Class");

    function typeClass() {
        var t = this;
        var a = [];

        var superFunc = function(m, superClass, func) {
            if(m!='constructor' && func.toString().indexOf("$super")>-1 ) {
                var funcArg = func.toString().replace(/function\s*\(([^\)]*)[\w\W]*/g,"$1").split(",");
                var funcStr = func.toString().replace(/function[^{]*{/,"").replace(/(\w|\.?)(this\.\$super|this)/g,function(m,m2,m3) {
                        if(!m2) { return m3+".$super"; }
                        return m;
                });
                funcStr = funcStr.substr(0,funcStr.length-1);
                func = superClass[m] = eval("false||function("+funcArg.join(",")+"){"+funcStr+"}");
            }

            return function() {
                var f = this.$this[m];
                var t = this.$this;
                var r = (t[m] = func).apply(t, arguments);
                t[m] = f;

                return r;
            };
        };

        while(t._$superClass !== undefined) {
            t.$super = new Object;
            t.$super.$this = this;

            for(var x in t._$superClass.prototype) {
                if (t._$superClass.prototype.hasOwnProperty(x)) {
                    if (this[x] === undefined && x !="$init") this[x] = t._$superClass.prototype[x];

                    if (x!='constructor' && x!='_$superClass' && typeof t._$superClass.prototype[x] == "function") {
                        t.$super[x] = superFunc(x, t._$superClass, t._$superClass.prototype[x]);
                    } else {
                        t.$super[x] = t._$superClass.prototype[x];
                    }
                }
            }

            if (typeof t.$super.$init == "function") a[a.length] = t;
            t = t.$super;
        }

        for(var i=a.length-1; i > -1; i--){
            a[i].$super.$init.apply(a[i].$super, arguments);
        }

        if(this.$autoBind) {
            for(var i in this){
                if(/^\_/.test(i) && typeof this[i] == "function") {
                    this[i] = nv.$Fn(this[i],this).bind();
                }
            }
        }

        if(typeof this.$init == "function") this.$init.apply(this,arguments);
    }

    if (oDef.$static !== undefined) {
        var i=0, x;
        for(x in oDef){
            if (oDef.hasOwnProperty(x)) {
                x=="$static"||i++;
            }
        }
        for(x in oDef.$static){
            if (oDef.$static.hasOwnProperty(x)) {
                typeClass[x] = oDef.$static[x];
            }
        }

        if (!i) return oDef.$static;
        delete oDef.$static;
    }

    typeClass.prototype = oDef;
    typeClass.prototype.constructor = typeClass;
    typeClass.prototype.kindOf = function(oClass){
        return nv._p_._kindOf(this.constructor.prototype, oClass.prototype);
    };
    typeClass.extend = nv.$Class.extend;

    return typeClass;
};

/**
	ìžì‹ ì´ ì–´ë–¤ í´ëž˜ìŠ¤ì˜ ì¢…ë¥˜ì¸ì§€ í™•ì¸í•˜ëŠ” ë©”ì„œë“œ.
	
	@method kindOf
	@param {nv.$Class} oClass í™•ì¸í•  í´ëž˜ìŠ¤(nv.$Class() ê°ì²´)
	@return {Boolean} true | false
	@since 2.0.0
	@example
		var Parent = $Class ({});
		var Parent2 = $Class ({});
		var Child = $Class ({}).extend(Parent);
		
		var child = new Child();
		child.kindOf(Parent);// true
		child.kindOf(Parent2);// false
 */
nv._p_._kindOf = function(oThis, oClass){
    if(oThis != oClass){
        if(oThis._$superClass) {
            return nv._p_._kindOf(oThis._$superClass.prototype,oClass);
        } else {
            return false;
        }
    } else {
        return true;
    }
};
 /**
	extend() ë©”ì„œë“œëŠ” íŠ¹ì • í´ëž˜ìŠ¤(nv.$Class() ê°ì²´)ë¥¼ ìƒì†í•œë‹¤. ìƒì†í•  ë¶€ëª¨ í´ëž˜ìŠ¤(Super Class)ë¥¼ ì§€ì •í•œë‹¤.
	
	@method extend
	@param {nv.$Class} superClass ìƒì†í•  ë¶€ëª¨ í´ëž˜ìŠ¤(nv.$Class() ê°ì²´).
	@return {this} ìƒì†ëœ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		var ClassExt = $Class(classDefinition);
		ClassExt.extend(superClass);
		// ClassExtëŠ” SuperClassë¥¼ ìƒì†ë°›ëŠ”ë‹¤.
 */
nv.$Class.extend = function(superClass) {
    var oArgs = g_checkVarType(arguments, {
        '4obj' : [ 'oDef:$Class' ]
    },"<static> $Class#extend");

    this.prototype._$superClass = superClass;


    // inherit static methods of parent
    var superProto = superClass.prototype;
    for(var prop in superProto){
        if(nv.$Jindo.isHash(superProto[prop])) nv.$Jindo._warn(nv.$Except.CANNOT_SET_OBJ_PROPERTY);
    }
    for(var x in superClass) {
        if (superClass.hasOwnProperty(x)) {
            if (x == "prototype") continue;
            this[x] = superClass[x];
        }
    }
    return this;
};
/**
	$super ì†ì„±ì€ ë¶€ëª¨ í´ëž˜ìŠ¤ì˜ ë©”ì„œë“œì— ì ‘ê·¼í•  ë•Œ ì‚¬ìš©í•œë‹¤. í•˜ìœ„ í´ëž˜ìŠ¤ëŠ” this.$super.method ë¡œ ìƒìœ„ í´ëž˜ìŠ¤ì˜ ë©”ì„œë“œì— ì ‘ê·¼í•  ìˆ˜ ìžˆìœ¼ë‚˜, this.$super.$super.method ì™€ ê°™ì´ í•œ ë‹¨ê³„ ì´ìƒì˜ ìƒìœ„ í´ëž˜ìŠ¤ëŠ” ì ‘ê·¼í•  ìˆ˜ ì—†ë‹¤. ë˜í•œ ë¶€ëª¨ í´ëž˜ìŠ¤ì™€ ìžì‹í´ëž˜ìŠ¤ê°€ ê°™ì€ ì´ë¦„ì˜ ë©”ì„œë“œë¥¼ ê°€ì§€ê³  ìžˆì„ ë•Œ ìžì‹í´ëž˜ìŠ¤ì—ì„œ $superë¡œ ê°™ì€ ì´ë¦„ì˜ ë©”ì„œë“œë¥¼ í˜¸ì¶œí•˜ë©´, ë¶€ëª¨ í´ëž˜ìŠ¤ì˜ ë©”ì„œë“œë¥¼ í˜¸ì¶œí•œë‹¤.
	
	@property $super
	@type $Class
	@example
		var Parent = $Class ({
			a: 100,
			b: 200,
			c: 300,
			sum2: function () {
				var init = this.sum();
				return init;
			},
			sum: function () {
				return this.a + this.b
			}
		});
	
		var Child = $Class ({
			a: 10,
			b: 20,
			sum2 : function () {
				var init = this.sum();
				return init;
			},
			sum: function () {
				return this.b;
			}
		}).extend (Parent);
	
		var oChild = new Child();
		var oParent = new Parent();
	
		oChild.sum();           // 20
		oChild.sum2();          // 20
		oChild.$super.sum();    // 30 -> ë¶€ëª¨ í´ëž˜ìŠ¤ì˜ 100(a)ê³¼ 200(b)ëŒ€ì‹  ìžì‹ í´ëž˜ìŠ¤ì˜ 10(a)ê³¼ 20(b)ì„ ë”í•œë‹¤.
		oChild.$super.sum2();   // 20 -> ë¶€ëª¨ í´ëž˜ìŠ¤ì˜ sum2 ë©”ì„œë“œì—ì„œ ë¶€ëª¨ í´ëž˜ìŠ¤ì˜ sum()ì´ ì•„ë‹Œ ìžì‹ í´ëž˜ìŠ¤ì˜ sum()ì„ í˜¸ì¶œí•œë‹¤.
*/
//-!nv.$Class end!-//

/**
    nvì˜ ë²„ì „ê³¼ íƒ€ìž… ì†ì„±

    nv.VERSION; // ë²„ì „ì •ë³´ ë¬¸ìžì—´ - ex. "2.9.2"
    nv.TYPE;    // ë²„ì „ íƒ€ìž… ë¬¸ìžì—´ (desktop|mobile) - ex. "desktop"
*/
nv.VERSION = "2.11.0";
nv.TYPE = "desktop";

/**
 	@fileOverview CSS ì…€ë ‰í„°ë¥¼ ì‚¬ìš©í•œ ì—˜ë¦¬ë¨¼íŠ¸ ì„ íƒ ì—”ì§„
	@name cssquery.js
	@author  AjaxUI lab
 */
//-!nv.cssquery start(nv.$Element)!-//
/**
 	Built-In Namespace _global_
	
	@class nv
	@static
 */
/**
 	$$() í•¨ìˆ˜(cssquery)ëŠ” CSS ì„ íƒìž(CSS Selector)ë¥¼ ì‚¬ìš©í•˜ì—¬ ê°ì²´ë¥¼ íƒìƒ‰í•œë‹¤. $$() í•¨ìˆ˜ ëŒ€ì‹  cssquery() í•¨ìˆ˜ë¥¼ ì‚¬ìš©í•´ë„ ëœë‹¤.

	@method $$
	@syntax sSelector, elBaseElement
	@syntax sSelector, sBaseElement
	@param {String+} sSelector CSS ì„ íƒìž.
	@param {Element+} [elBaseElement] íƒìƒ‰ ëŒ€ìƒì´ ë˜ëŠ” DOM ìš”ì†Œ. ì§€ì •í•œ ìš”ì†Œì˜ í•˜ìœ„ ë…¸ë“œì—ì„œë§Œ ê°ì²´ë¥¼ íƒìƒ‰í•œë‹¤.
	@param {String+} sBaseElement íƒìƒ‰ ëŒ€ìƒì´ ë˜ëŠ” DOM ìš”ì†Œì˜ ID ë¬¸ìžì—´. ì§€ì •í•œ ìš”ì†Œì˜ í•˜ìœ„ ë…¸ë“œì—ì„œë§Œ ê°ì²´ë¥¼ íƒìƒ‰í•œë‹¤.
	@return {Array} ì¡°ê±´ì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œë¥¼ ë°°ì—´ í˜•íƒœë¡œ ë°˜í™˜í•œë‹¤.
	@remark CSS ì„ íƒìžë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” íŒ¨í„´ì€ í‘œì¤€ íŒ¨í„´ê³¼ ë¹„í‘œì¤€ íŒ¨í„´ì´ ìžˆë‹¤. í‘œì¤€ íŒ¨í„´ì€ CSS Level3 ëª…ì„¸ì„œì— ìžˆëŠ” íŒ¨í„´ì„ ì§€ì›í•œë‹¤. ì„ íƒìžì˜ íŒ¨í„´ì— ëŒ€í•œ ì„¤ëª…ì€ ë‹¤ìŒ í‘œì™€ See Also í•­ëª©ì„ ì°¸ê³ í•œë‹¤.<br>
		<h5>ìš”ì†Œ, ID, í´ëž˜ìŠ¤ ì„ íƒìž</h5>
		<table class="tbl_board">
			<caption class="hide">ìš”ì†Œ, ID, í´ëž˜ìŠ¤ ì„ íƒìž</caption>
			<thead>
				<tr>
					<th scope="col" style="width:20%">íŒ¨í„´</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">*</td>
					<td class="txt">ëª¨ë“  ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("*");
	// ë¬¸ì„œì˜ ëª¨ë“  ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">HTML Tagname</td>
					<td class="txt">ì§€ì •ëœ HTML íƒœê·¸ ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("div");
	// ë¬¸ì„œì˜ ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">#id</td>
					<td class="txt">IDê°€ ì§€ì •ëœ ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("#application");
	// IDê°€ applicationì¸ ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">.classname</td>
					<td class="txt">í´ëž˜ìŠ¤ê°€ ì§€ì •ëœ ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$(".img");
	// í´ëž˜ìŠ¤ê°€ imgì¸ ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
			</tbody>
		</table>
		<h5>ì†ì„± ì„ íƒìž</h5>
		<table class="tbl_board">
			<caption class="hide">ì†ì„± ì„ íƒìž</caption>
			<thead>
				<tr>
					<th scope="col" style="width:20%">íŒ¨í„´</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">[type]</td>
					<td class="txt">ì§€ì •ëœ ì†ì„±ì„ ê°–ê³  ìžˆëŠ” ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("input[type]");
	// type ì†ì„±ì„ ê°–ëŠ” &lt;input&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">[type=value]</td>
					<td class="txt">ì†ì„±ê³¼ ê°’ì´ ì¼ì¹˜í•˜ëŠ” ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("input[type=text]");
	// type ì†ì„± ê°’ì´ textì¸ &lt;input&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">[type^=value]</td>
					<td class="txt">ì†ì„±ì˜ ê°’ì´ íŠ¹ì • ê°’ìœ¼ë¡œ ì‹œìž‘í•˜ëŠ” ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("input[type^=hid]");
	//type ì†ì„± ê°’ì´ hidë¡œ ì‹œìž‘í•˜ëŠ” &lt;input&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">[type$=value]</td>
					<td class="txt">ì†ì„±ì˜ ê°’ì´ íŠ¹ì • ê°’ìœ¼ë¡œ ëë‚˜ëŠ” ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("input[type$=en]");
	//type ì†ì„± ê°’ì´ enìœ¼ë¡œ ëë‚˜ëŠ” &lt;input&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">[type~=value]</td>
					<td class="txt">ì†ì„± ê°’ì— ê³µë°±ìœ¼ë¡œ êµ¬ë¶„ëœ ì—¬ëŸ¬ ê°œì˜ ê°’ì´ ì¡´ìž¬í•˜ëŠ” ê²½ìš°, ê°ê°ì˜ ê°’ ì¤‘ í•œê°€ì§€ ê°’ì„ ê°–ëŠ” ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	&lt;img src="..." alt="welcome to naver"&gt;
	$$("img[alt~=welcome]"); // ìžˆìŒ.
	$$("img[alt~=naver]"); // ìžˆìŒ.
	$$("img[alt~=wel]"); // ì—†ìŒ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">[type*=value]</td>
					<td class="txt">ì†ì„± ê°’ ì¤‘ì— ì¼ì¹˜í•˜ëŠ” ê°’ì´ ìžˆëŠ” ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("img[alt*=come]"); // ìžˆìŒ.
	$$("img[alt*=nav]"); // ìžˆìŒ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">[type!=value]</td>
					<td class="txt">ê°’ì´ ì§€ì •ëœ ê°’ê³¼ ì¼ì¹˜í•˜ì§€ ì•ŠëŠ” ìš”ì†Œ.
<pre class="code "><code class="prettyprint linenums">
	$$("input[type!=text]");
	// type ì†ì„± ê°’ì´ textê°€ ì•„ë‹Œ ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">[@type]</td>
					<td class="txt">cssquery ì „ìš©ìœ¼ë¡œ ì‚¬ìš©í•˜ëŠ” ì„ íƒìžë¡œì„œ ìš”ì†Œì˜ ì†ì„±ì´ ì•„ë‹Œ ìš”ì†Œì˜ ìŠ¤íƒ€ì¼ ì†ì„±ì„ ì‚¬ìš©í•œë‹¤. CSS ì†ì„± ì„ íƒìžì˜ íŠ¹ì„±ì„ ëª¨ë‘ ì ìš©í•´ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div[@display=block]");
	// &lt;div&gt; ìš”ì†Œ ì¤‘ì— display ìŠ¤íƒ€ì¼ ì†ì„±ì˜ ê°’ì´ blockì¸ ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
			</tbody>
		</table>
		<h5>ê°€ìƒ í´ëž˜ìŠ¤ ì„ íƒìž</h5>
		<table class="tbl_board">
			<caption class="hide">ê°€ìƒ í´ëž˜ìŠ¤ ì„ íƒìž</caption>
			<thead>
				<tr>
					<th scope="col" style="width:20%">íŒ¨í„´</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">:nth-child(n)</td>
					<td class="txt">në²ˆì§¸ ìžì‹ì¸ì§€ ì—¬ë¶€ë¡œ í•´ë‹¹ ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div:nth-child(2)");
	// ë‘ ë²ˆì§¸ ìžì‹ ìš”ì†Œì¸ &lt;div&gt; ìš”ì†Œ.
	
	$$("div:nth-child(2n)");
	$$("div:nth-child(even)");
	// ì§ìˆ˜ ë²ˆì§¸ ìžì‹ ìš”ì†Œì¸ ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
	
	$$("div:nth-child(2n+1)");
	$$("div:nth-child(odd)");
	// í™€ìˆ˜ ë²ˆì§¸ ìžì‹ ìš”ì†Œì¸ ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
	
	$$("div:nth-child(4n)");
	// 4ì˜ ë°°ìˆ˜ ë²ˆì§¸ ìžì‹ ìš”ì†Œì¸ ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">:nth-last-child(n)</td>
					<td class="txt">nth-childì™€ ë™ì¼í•˜ë‚˜, ë’¤ì—ì„œë¶€í„° ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div:nth-last-child(2)");
	// ë’¤ì—ì„œ ë‘ ë²ˆì§¸ ìžì‹ ìš”ì†Œì¸ ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">:last-child</td>
					<td class="txt">ë§ˆì§€ë§‰ ìžì‹ì¸ì§€ ì—¬ë¶€ë¡œ ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div:last-child");
	// ë§ˆì§€ë§‰ ìžì‹ ìš”ì†Œì¸ ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">:nth-of-type(n)</td>
					<td class="txt">në²ˆì§¸ë¡œ ë°œê²¬ëœ ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	&lt;div&gt;
		&lt;p&gt;1&lt;/p&gt;
		&lt;span&gt;2&lt;/span&gt;
		&lt;span&gt;3&lt;/span&gt;
	&lt;/div&gt;
</code></pre>
						ìœ„ì™€ ê°™ì€ DOMì´ ìžˆì„ ë•Œ, $$("span:nth-child(1)")ì€ &lt;span&gt; ìš”ì†Œê°€ firstChildì¸ ìš”ì†ŒëŠ” ì—†ê¸° ë•Œë¬¸ì— ê²°ê³¼ ê°’ì„ ë°˜í™˜í•˜ì§€ ì•ŠëŠ”ë‹¤ í•˜ì§€ë§Œ $$("span:nth-of-type(1)")ëŠ” &lt;span&gt; ìš”ì†Œ ì¤‘ì—ì„œ ì²« ë²ˆì§¸ &lt;span&gt; ìš”ì†Œì¸ &lt;span&gt;2&lt;/span&gt;ë¥¼ ì–»ì–´ì˜¤ê²Œ ëœë‹¤.<br>nth-childì™€ ë§ˆì°¬ê°€ì§€ë¡œ ì§ìˆ˜/í™€ìˆ˜ ë“±ì˜ ìˆ˜ì‹ì„ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
					</td>
				</tr>
				<tr>
					<td class="txt bold">:first-of-type</td>
					<td class="txt">ê°™ì€ íƒœê·¸ ì´ë¦„ì„ ê°–ëŠ” í˜•ì œ ìš”ì†Œ ì¤‘ì—ì„œ ì²« ë²ˆì§¸ ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.<br>nth-of-type(1)ê³¼ ê°™ì€ ê²°ê³¼ ê°’ì„ ë°˜í™˜í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">:nth-last-of-type</td>
					<td class="txt">nth-of-typeê³¼ ë™ì¼í•˜ë‚˜, ë’¤ì—ì„œë¶€í„° ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">:last-of-type</td>
					<td class="txt">ê°™ì€ íƒœê·¸ ì´ë¦„ì„ ê°–ëŠ” í˜•ì œ ìš”ì†Œ ì¤‘ì—ì„œ ë§ˆì§€ë§‰ ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.<br>nth-last-of-type(1)ê³¼ ê°™ì€ ê²°ê³¼ ê°’ì„ ë°˜í™˜í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">:contains</td>
					<td class="txt">í…ìŠ¤íŠ¸ ë…¸ë“œì— íŠ¹ì • ë¬¸ìžì—´ì„ í¬í•¨í•˜ê³  ìžˆëŠ”ì§€ ì—¬ë¶€ë¡œ í•´ë‹¹ ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("span:contains(Jindo)");
	// "Jindo" ë¬¸ìžì—´ë¥¼ í¬í•¨í•˜ê³  ìžˆëŠ” &lt;span&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">:only-child</td>
					<td class="txt">í˜•ì œê°€ ì—†ëŠ” ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	&lt;div&gt;
		&lt;p&gt;1&lt;/p&gt;
		&lt;span&gt;2&lt;/span&gt;
		&lt;span&gt;3&lt;/span&gt;
	&lt;/div&gt;
</code></pre>
						ìœ„ì˜ DOMì—ì„œ $$("div:only-child")ë§Œ ë°˜í™˜ ê°’ì´ ìžˆê³ , $$("p:only-child") ë˜ëŠ” $$("span:only-child")ëŠ” ë°˜í™˜ ê°’ì´ ì—†ë‹¤. ì¦‰, í˜•ì œ ë…¸ë“œê°€ ì—†ëŠ” &lt;div&gt; ìš”ì†Œë§Œ ì„ íƒëœë‹¤.
					</td>
				</tr>
				<tr>
					<td class="txt bold">:empty</td>
					<td class="txt">ë¹„ì–´ìžˆëŠ” ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("span:empty");
	// í…ìŠ¤íŠ¸ ë…¸ë“œ ë˜ëŠ” í•˜ìœ„ ë…¸ë“œê°€ ì—†ëŠ” &lt;span&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">:not</td>
					<td class="txt">ì„ íƒìžì˜ ì¡°ê±´ê³¼ ë°˜ëŒ€ì¸ ìš”ì†Œë¥¼ ì„ íƒí•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div:not(.img)");
	// img í´ëž˜ìŠ¤ê°€ ì—†ëŠ” &lt;div&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
			</tbody>
		</table>
		<h5>ì½¤ë¹„ë„¤ì´í„° ì„ íƒìž</h5>
		<table class="tbl_board">
			<caption class="hide">ì½¤ë¹„ë„¤ì´í„° ì„ íƒìž</caption>
			<thead>
				<tr>
					<th scope="col" style="width:20%">íŒ¨í„´</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">ê³µë°± (space)</td>
					<td class="txt">í•˜ìœ„ì˜ ëª¨ë“  ìš”ì†Œë¥¼ ì˜ë¯¸í•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("body div");
	// &lt;body&gt; ìš”ì†Œ í•˜ìœ„ì— ì†í•œ ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">&gt;</td>
					<td class="txt">ìžì‹ ë…¸ë“œì— ì†í•˜ëŠ” ëª¨ë“  ìš”ì†Œë¥¼ ì˜ë¯¸í•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div &gt; span");
	// &lt;div&gt; ìš”ì†Œì˜ ìžì‹ ìš”ì†Œ ì¤‘ ëª¨ë“  &lt;span&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">+</td>
					<td class="txt">ì§€ì •í•œ ìš”ì†Œì˜ ë°”ë¡œ ë‹¤ìŒ í˜•ì œ ë…¸ë“œì— ì†í•˜ëŠ” ëª¨ë“  ìš”ì†Œë¥¼ ì˜ë¯¸í•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div + p");
	// &lt;div&gt; ìš”ì†Œì˜ nextSiblingì— í•´ë‹¹í•˜ëŠ” ëª¨ë“  &lt;p&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">~</td>
					<td class="txt">+ íŒ¨í„´ê³¼ ë™ì¼í•˜ë‚˜, ë°”ë¡œ ë‹¤ìŒ í˜•ì œ ë…¸ë“œë¿ë§Œ ì•„ë‹ˆë¼ ì§€ì •ëœ ë…¸ë“œ ì´í›„ì— ì†í•˜ëŠ” ëª¨ë“  ìš”ì†Œë¥¼ ì˜ë¯¸í•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("div ~ p");
	// &lt;div&gt; ìš”ì†Œ ì´í›„ì˜ í˜•ì œ ë…¸ë“œì— ì†í•˜ëŠ” ëª¨ë“  &lt;p&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
				<tr>
					<td class="txt bold">!</td>
					<td class="txt">cssquery ì „ìš©ìœ¼ë¡œ, ì½¤ë¹„ë„¤ì´í„°ì˜ ë°˜ëŒ€ ë°©í–¥ìœ¼ë¡œ íƒìƒ‰ì„ ì‹œìž‘í•´ ìš”ì†Œë¥¼ ê²€ìƒ‰í•œë‹¤.
<pre class="code "><code class="prettyprint linenums">
	$$("span ! div");
	// &lt;span&gt; ìš”ì†Œì˜ ìƒìœ„ì— ìžˆëŠ” ëª¨ë“  &lt;div&gt; ìš”ì†Œ.
</code></pre>
					</td>
				</tr>
			</tbody>
		</table>
	@see nv.$Document#queryAll
	@see http://www.w3.org/TR/css3-selectors/ CSS Level3 ëª…ì„¸ì„œ - W3C
	@history 2.4.0 Support mobileë²„ì „ JindoJSì—ì„œ ! ì½¤ë¹„ë„¤ì´í„° ì§€ì›(!, !>, !~, !+)
	@example
		// ë¬¸ì„œì—ì„œ IMG íƒœê·¸ë¥¼ ì°¾ëŠ”ë‹¤.
		var imgs = $$('IMG');
		
		// div ìš”ì†Œ í•˜ìœ„ì—ì„œ IMG íƒœê·¸ë¥¼ ì°¾ëŠ”ë‹¤.
		var imgsInDiv = $$('IMG', $('div'));
		
		// ë¬¸ì„œì—ì„œ IMG íƒœê·¸ ì¤‘ ê°€ìž¥ ì²« ìš”ì†Œë¥¼ ì°¾ëŠ”ë‹¤.
		var firstImg = $$.getSingle('IMG');
 */
nv.$$ = nv.cssquery = (function() {
    /*
     querySelector ì„¤ì •.
     */
    var sVersion = '3.0';
    
    var debugOption = { repeat : 1 };
    
    /*
     ë¹ ë¥¸ ì²˜ë¦¬ë¥¼ ìœ„í•´ ë…¸ë“œë§ˆë‹¤ ìœ ì¼í‚¤ ê°’ ì…‹íŒ…
     */
    var UID = 1;
    
    var cost = 0;
    var validUID = {};
    
    var bSupportByClassName = document.getElementsByClassName ? true : false;
    var safeHTML = false;
    
    var getUID4HTML = function(oEl) {
        
        var nUID = safeHTML ? (oEl._cssquery_UID && oEl._cssquery_UID[0]) : oEl._cssquery_UID;
        if (nUID && validUID[nUID] == oEl) return nUID;
        
        nUID = UID++;
        oEl._cssquery_UID = safeHTML ? [ nUID ] : nUID;
        
        validUID[nUID] = oEl;
        return nUID;

    };
    function GEBID(oBase,sId,oDoc) {
        if(oBase.nodeType === 9 || oBase.parentNode && oBase.parentNode.tagName) {
            return _getElementById(oDoc,sId);
        } else {
            var aEle = oBase.getElementsByTagName("*");

            for(var i = 0,l = aEle.length; i < l; i++){
                if(aEle[i].id === sId) {
                    return aEle[i];
                }
            }
        }
    }
    var getUID4XML = function(oEl) {
        var oAttr = oEl.getAttribute('_cssquery_UID');
        var nUID = safeHTML ? (oAttr && oAttr[0]) : oAttr;
        
        if (!nUID) {
            nUID = UID++;
            oEl.setAttribute('_cssquery_UID', safeHTML ? [ nUID ] : nUID);
        }
        
        return nUID;
        
    };
    
    var getUID = getUID4HTML;
    
    var uniqid = function(sPrefix) {
        return (sPrefix || '') + new Date().getTime() + parseInt(Math.random() * 100000000,10);
    };
    
    function getElementsByClass(searchClass,node,tag) {
        var classElements = [];

        if(node == null) node = document;
        if(tag == null) tag = '*';

        var els = node.getElementsByTagName(tag);
        var elsLen = els.length;
        var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");

        for(var i=0,j=0; i < elsLen; i++) {
            if(pattern.test(els[i].className)) {
                classElements[j] = els[i];
                j++;
            }
        }
        return classElements;
    }

    var getChilds_dontShrink = function(oEl, sTagName, sClassName) {
        if (bSupportByClassName && sClassName) {
            if(oEl.getElementsByClassName)
                return oEl.getElementsByClassName(sClassName);
            if(oEl.querySelectorAll)
                return oEl.querySelectorAll(sClassName);
            return getElementsByClass(sClassName, oEl, sTagName);
        }else if (sTagName == '*') {
            return oEl.all || oEl.getElementsByTagName(sTagName);
        }
        return oEl.getElementsByTagName(sTagName);
    };

    var clearKeys = function() {
         backupKeys._keys = {};
    };
    
    var oDocument_dontShrink = document;
    
    var bXMLDocument = false;
    
    /*
     ë”°ì˜´í‘œ, [] ë“± íŒŒì‹±ì— ë¬¸ì œê°€ ë  ìˆ˜ ìžˆëŠ” ë¶€ë¶„ replace ì‹œì¼œë†“ê¸°
     */
    var backupKeys = function(sQuery) {
        
        var oKeys = backupKeys._keys;
        
        /*
         ìž‘ì€ ë”°ì˜´í‘œ ê±·ì–´ë‚´ê¸°
         */
        sQuery = sQuery.replace(/'(\\'|[^'])*'/g, function(sAll) {
            var uid = uniqid('QUOT');
            oKeys[uid] = sAll;
            return uid;
        });
        
        /*
         í° ë”°ì˜´í‘œ ê±·ì–´ë‚´ê¸°
         */
        sQuery = sQuery.replace(/"(\\"|[^"])*"/g, function(sAll) {
            var uid = uniqid('QUOT');
            oKeys[uid] = sAll;
            return uid;
        });
        
        /*
         [ ] í˜•íƒœ ê±·ì–´ë‚´ê¸°
         */
        sQuery = sQuery.replace(/\[(.*?)\]/g, function(sAll, sBody) {
            if (sBody.indexOf('ATTR') == 0) return sAll;
            var uid = '[' + uniqid('ATTR') + ']';
            oKeys[uid] = sAll;
            return uid;
        });
    
        /*
        ( ) í˜•íƒœ ê±·ì–´ë‚´ê¸°
         */
        var bChanged;
        
        do {
            
            bChanged = false;
        
            sQuery = sQuery.replace(/\(((\\\)|[^)|^(])*)\)/g, function(sAll, sBody) {
                if (sBody.indexOf('BRCE') == 0) return sAll;
                var uid = '_' + uniqid('BRCE');
                oKeys[uid] = sAll;
                bChanged = true;
                return uid;
            });
        
        } while(bChanged);
    
        return sQuery;
        
    };
    
    /*
     replace ì‹œì¼œë†“ì€ ë¶€ë¶„ ë³µêµ¬í•˜ê¸°
     */
    var restoreKeys = function(sQuery, bOnlyAttrBrace) {
        
        var oKeys = backupKeys._keys;
    
        var bChanged;
        var rRegex = bOnlyAttrBrace ? /(\[ATTR[0-9]+\])/g : /(QUOT[0-9]+|\[ATTR[0-9]+\])/g;
        
        do {
            
            bChanged = false;
    
            sQuery = sQuery.replace(rRegex, function(sKey) {
                
                if (oKeys[sKey]) {
                    bChanged = true;
                    return oKeys[sKey];
                }
                
                return sKey;
    
            });
        
        } while(bChanged);
        
        /*
        ( ) ëŠ” í•œêº¼í’€ë§Œ ë²—ê²¨ë‚´ê¸°
         */
        sQuery = sQuery.replace(/_BRCE[0-9]+/g, function(sKey) {
            return oKeys[sKey] ? oKeys[sKey] : sKey;
        });
        
        return sQuery;
        
    };
    
    /*
     replace ì‹œì¼œë†“ì€ ë¬¸ìžì—´ì—ì„œ Quot ì„ ì œì™¸í•˜ê³  ë¦¬í„´
     */
    var restoreString = function(sKey) {
        
        var oKeys = backupKeys._keys;
        var sOrg = oKeys[sKey];
        
        if (!sOrg) return sKey;
        return eval(sOrg);
        
    };
    
    var wrapQuot = function(sStr) {
        return '"' + sStr.replace(/"/g, '\\"') + '"';
    };
    
    var getStyleKey = function(sKey) {

        if (/^@/.test(sKey)) return sKey.substr(1);
        return null;
        
    };
    
    var getCSS = function(oEl, sKey) {
        
        if (oEl.currentStyle) {
            
            if (sKey == "float") sKey = "styleFloat";
            return oEl.currentStyle[sKey] || oEl.style[sKey];
            
        } else if (window.getComputedStyle) {
            
            return oDocument_dontShrink.defaultView.getComputedStyle(oEl, null).getPropertyValue(sKey.replace(/([A-Z])/g,"-$1").toLowerCase()) || oEl.style[sKey];
            
        }

        if (sKey == "float" && nv._p_._JINDO_IS_IE) sKey = "styleFloat";
        return oEl.style[sKey];
        
    };

    var oCamels = {
        'accesskey' : 'accessKey',
        'cellspacing' : 'cellSpacing',
        'cellpadding' : 'cellPadding',
        'class' : 'className',
        'colspan' : 'colSpan',
        'for' : 'htmlFor',
        'maxlength' : 'maxLength',
        'readonly' : 'readOnly',
        'rowspan' : 'rowSpan',
        'tabindex' : 'tabIndex',
        'valign' : 'vAlign'
    };

    var getDefineCode = function(sKey) {
        var sVal;
        var sStyleKey;

        if (bXMLDocument) {
            
            sVal = 'oEl.getAttribute("' + sKey + '",2)';
        
        } else {
        
            if (sStyleKey = getStyleKey(sKey)) {
                
                sKey = '$$' + sStyleKey;
                sVal = 'getCSS(oEl, "' + sStyleKey + '")';
                
            } else {
                
                switch (sKey) {
                case 'checked':
                    sVal = 'oEl.checked + ""';
                    break;
                    
                case 'disabled':
                    sVal = 'oEl.disabled + ""';
                    break;
                    
                case 'enabled':
                    sVal = '!oEl.disabled + ""';
                    break;
                    
                case 'readonly':
                    sVal = 'oEl.readOnly + ""';
                    break;
                    
                case 'selected':
                    sVal = 'oEl.selected + ""';
                    break;
                    
                default:
                    if (oCamels[sKey]) {
                        sVal = 'oEl.' + oCamels[sKey];
                    } else {
                        sVal = 'oEl.getAttribute("' + sKey + '",2)';
                    } 
                }
                
            }
            
        }
            
        return '_' + sKey.replace(/\-/g,"_") + ' = ' + sVal;
    };
    
    var getReturnCode = function(oExpr) {
        
        var sStyleKey = getStyleKey(oExpr.key);
        
        var sVar = '_' + (sStyleKey ? '$$' + sStyleKey : oExpr.key);
        sVar = sVar.replace(/\-/g,"_");
        var sVal = oExpr.val ? wrapQuot(oExpr.val) : '';
        
        switch (oExpr.op) {
        case '~=':
            return '(' + sVar + ' && (" " + ' + sVar + ' + " ").indexOf(" " + ' + sVal + ' + " ") > -1)';
        case '^=':
            return '(' + sVar + ' && ' + sVar + '.indexOf(' + sVal + ') == 0)';
        case '$=':
            return '(' + sVar + ' && ' + sVar + '.substr(' + sVar + '.length - ' + oExpr.val.length + ') == ' + sVal + ')';
        case '*=':
            return '(' + sVar + ' && ' + sVar + '.indexOf(' + sVal + ') > -1)';
        case '!=':
            return '(' + sVar + ' != ' + sVal + ')';
        case '=':
            return '(' + sVar + ' == ' + sVal + ')';
        }
    
        return '(' + sVar + ')';
        
    };
    
    var getNodeIndex = function(oEl) {
        var nUID = getUID(oEl);
        var nIndex = oNodeIndexes[nUID] || 0;
        
        /*
         ë…¸ë“œ ì¸ë±ìŠ¤ë¥¼ êµ¬í•  ìˆ˜ ì—†ìœ¼ë©´
         */
        if (nIndex == 0) {

            for (var oSib = (oEl.parentNode || oEl._IE5_parentNode).firstChild; oSib; oSib = oSib.nextSibling) {
                
                if (oSib.nodeType != 1){ 
                    continue;
                }
                nIndex++;

                setNodeIndex(oSib, nIndex);
                
            }
                        
            nIndex = oNodeIndexes[nUID];
            
        }
                
        return nIndex;
                
    };
    
    /*
     ëª‡ë²ˆì§¸ ìžì‹ì¸ì§€ ì„¤ì •í•˜ëŠ” ë¶€ë¶„
     */
    var oNodeIndexes = {};

    var setNodeIndex = function(oEl, nIndex) {
        var nUID = getUID(oEl);
        oNodeIndexes[nUID] = nIndex;
    };
    
    var unsetNodeIndexes = function() {
        setTimeout(function() { oNodeIndexes = {}; }, 0);
    };
    
    /*
     ê°€ìƒ í´ëž˜ìŠ¤
     */
    var oPseudoes_dontShrink = {
    
        'contains' : function(oEl, sOption) {
            return (oEl.innerText || oEl.textContent || '').indexOf(sOption) > -1;
        },
        
        'last-child' : function(oEl, sOption) {
            for (oEl = oEl.nextSibling; oEl; oEl = oEl.nextSibling){
                if (oEl.nodeType == 1)
                    return false;
            }
                
            
            return true;
        },
        
        'first-child' : function(oEl, sOption) {
            for (oEl = oEl.previousSibling; oEl; oEl = oEl.previousSibling){
                if (oEl.nodeType == 1)
                    return false;
            }
                
                    
            return true;
        },
        
        'only-child' : function(oEl, sOption) {
            var nChild = 0;
            
            for (var oChild = (oEl.parentNode || oEl._IE5_parentNode).firstChild; oChild; oChild = oChild.nextSibling) {
                if (oChild.nodeType == 1) nChild++;
                if (nChild > 1) return false;
            }
            
            return nChild ? true : false;
        },

        'empty' : function(oEl, _) {
            return oEl.firstChild ? false : true;
        },
        
        'nth-child' : function(oEl, nMul, nAdd) {
            var nIndex = getNodeIndex(oEl);
            return nIndex % nMul == nAdd;
        },
        
        'nth-last-child' : function(oEl, nMul, nAdd) {
            var oLast = (oEl.parentNode || oEl._IE5_parentNode).lastChild;
            for (; oLast; oLast = oLast.previousSibling){
                if (oLast.nodeType == 1) break;
            }
                
                
            var nTotal = getNodeIndex(oLast);
            var nIndex = getNodeIndex(oEl);
            
            var nLastIndex = nTotal - nIndex + 1;
            return nLastIndex % nMul == nAdd;
        },
        'checked' : function(oEl){
            return !!oEl.checked;
        },
        'selected' : function(oEl){
            return !!oEl.selected;
        },
        'enabled' : function(oEl){
            return !oEl.disabled;
        },
        'disabled' : function(oEl){
            return !!oEl.disabled;
        }
    };
    
    /*
     ë‹¨ì¼ part ì˜ body ì—ì„œ expression ë½‘ì•„ëƒ„
     */
    var getExpression = function(sBody) {

        var oRet = { defines : '', returns : 'true' };
        
        var sBody = restoreKeys(sBody, true);
    
        var aExprs = [];
        var aDefineCode = [], aReturnCode = [];
        var sId, sTagName;
        
        /*
         ìœ ì‚¬í´ëž˜ìŠ¤ ì¡°ê±´ ì–»ì–´ë‚´ê¸°
         */
        var sBody = sBody.replace(/:([\w-]+)(\(([^)]*)\))?/g, function(_1, sType, _2, sOption) {
            switch (sType) {
                case 'not':
                    /*
                     ê´„í˜¸ ì•ˆì— ìžˆëŠ”ê±° ìž¬ê·€íŒŒì‹±í•˜ê¸°
                     */
                    var oInner = getExpression(sOption);

                    var sFuncDefines = oInner.defines;
                    var sFuncReturns = oInner.returnsID + oInner.returnsTAG + oInner.returns;

                    aReturnCode.push('!(function() { ' + sFuncDefines + ' return ' + sFuncReturns + ' })()');
                    break;

                case 'nth-child':
                case 'nth-last-child':
                    sOption =  restoreString(sOption);

                    if (sOption == 'even'){
                        sOption = '2n';
                    }else if (sOption == 'odd') {
                        sOption = '2n+1';
                    }

                    var nMul, nAdd;
                    var matchstr = sOption.match(/([0-9]*)n([+-][0-9]+)*/);
                    if (matchstr) {
                        nMul = matchstr[1] || 1;
                        nAdd = matchstr[2] || 0;
                    } else {
                        nMul = Infinity;
                        nAdd = parseInt(sOption,10);
                    }
                    aReturnCode.push('oPseudoes_dontShrink[' + wrapQuot(sType) + '](oEl, ' + nMul + ', ' + nAdd + ')');
                    break;

                case 'first-of-type':
                case 'last-of-type':
                    sType = (sType == 'first-of-type' ? 'nth-of-type' : 'nth-last-of-type');
                    sOption = 1;
                    // 'break' statement was intentionally omitted.
                case 'nth-of-type':
                case 'nth-last-of-type':
                    sOption =  restoreString(sOption);

                    if (sOption == 'even') {
                        sOption = '2n';
                    }else if (sOption == 'odd'){
                        sOption = '2n+1';
                    }

                    var nMul, nAdd;

                    if (/([0-9]*)n([+-][0-9]+)*/.test(sOption)) {
                        nMul = parseInt(RegExp.$1,10) || 1;
                        nAdd = parseInt(RegExp.$2,20) || 0;
                    } else {
                        nMul = Infinity;
                        nAdd = parseInt(sOption,10);
                    }

                    oRet.nth = [ nMul, nAdd, sType ];
                    break;

                default:
                    sOption = sOption ? restoreString(sOption) : '';
                    aReturnCode.push('oPseudoes_dontShrink[' + wrapQuot(sType) + '](oEl, ' + wrapQuot(sOption) + ')');
            }
            
            return '';
        });
        
        /*
         [key=value] í˜•íƒœ ì¡°ê±´ ì–»ì–´ë‚´ê¸°
         */
        var sBody = sBody.replace(/\[(@?[\w-]+)(([!^~$*]?=)([^\]]*))?\]/g, function(_1, sKey, _2, sOp, sVal) {
            sKey = restoreString(sKey);
            sVal = restoreString(sVal);
            
            if (sKey == 'checked' || sKey == 'disabled' || sKey == 'enabled' || sKey == 'readonly' || sKey == 'selected') {
                
                if (!sVal) {
                    sOp = '=';
                    sVal = 'true';
                }
                
            }
            aExprs.push({ key : sKey, op : sOp, val : sVal });
            return '';
    
        });
        
        var sClassName = null;
    
        /*
         í´ëž˜ìŠ¤ ì¡°ê±´ ì–»ì–´ë‚´ê¸°
         */
        var sBody = sBody.replace(/\.([\w-]+)/g, function(_, sClass) { 
            aExprs.push({ key : 'class', op : '~=', val : sClass });
            if (!sClassName) sClassName = sClass;
            return '';
        });
        
        /*
         id ì¡°ê±´ ì–»ì–´ë‚´ê¸°
         */
        var sBody = sBody.replace(/#([\w-]+)/g, function(_, sIdValue) {
            if (bXMLDocument) {
                aExprs.push({ key : 'id', op : '=', val : sIdValue });
            }else{
                sId = sIdValue;
            }
            return '';
        });
        
        sTagName = sBody == '*' ? '' : sBody;
    
        /*
         match í•¨ìˆ˜ ì½”ë“œ ë§Œë“¤ì–´ ë‚´ê¸°
         */
        var oVars = {};
        
        for (var i = 0, oExpr; oExpr = aExprs[i]; i++) {
            
            var sKey = oExpr.key;
            
            if (!oVars[sKey]) aDefineCode.push(getDefineCode(sKey));
            /*
             ìœ ì‚¬í´ëž˜ìŠ¤ ì¡°ê±´ ê²€ì‚¬ê°€ ë§¨ ë’¤ë¡œ ê°€ë„ë¡ unshift ì‚¬ìš©
             */
            aReturnCode.unshift(getReturnCode(oExpr));
            oVars[sKey] = true;
            
        }
        
        if (aDefineCode.length) oRet.defines = 'var ' + aDefineCode.join(',') + ';';
        if (aReturnCode.length) oRet.returns = aReturnCode.join('&&');
        
        oRet.quotID = sId ? wrapQuot(sId) : '';
        oRet.quotTAG = sTagName ? wrapQuot(bXMLDocument ? sTagName : sTagName.toUpperCase()) : '';
        
        if (bSupportByClassName) oRet.quotCLASS = sClassName ? wrapQuot(sClassName) : '';
        
        oRet.returnsID = sId ? 'oEl.id == ' + oRet.quotID + ' && ' : '';
        oRet.returnsTAG = sTagName && sTagName != '*' ? 'oEl.tagName == ' + oRet.quotTAG + ' && ' : '';
        
        return oRet;
        
    };
    
    /*
     ì¿¼ë¦¬ë¥¼ ì—°ì‚°ìž ê¸°ì¤€ìœ¼ë¡œ ìž˜ë¼ëƒ„
     */
    var splitToParts = function(sQuery) {
        
        var aParts = [];
        var sRel = ' ';
        
        var sBody = sQuery.replace(/(.*?)\s*(!?[+>~ ]|!)\s*/g, function(_, sBody, sRelative) {
            
            if (sBody) aParts.push({ rel : sRel, body : sBody });
    
            sRel = sRelative.replace(/\s+$/g, '') || ' ';
            return '';
            
        });
    
        if (sBody) aParts.push({ rel : sRel, body : sBody });
        
        return aParts;
        
    };
    
    var isNth_dontShrink = function(oEl, sTagName, nMul, nAdd, sDirection) {
        
        var nIndex = 0;
        for (var oSib = oEl; oSib; oSib = oSib[sDirection]){
            if (oSib.nodeType == 1 && (!sTagName || sTagName == oSib.tagName))
                    nIndex++;
        }
            

        return nIndex % nMul == nAdd;

    };
    
    /*
     ìž˜ë¼ë‚¸ part ë¥¼ í•¨ìˆ˜ë¡œ ì»´íŒŒì¼ í•˜ê¸°
     */
    var compileParts = function(aParts) {
        var aPartExprs = [];
        /*
         ìž˜ë¼ë‚¸ ë¶€ë¶„ë“¤ ì¡°ê±´ ë§Œë“¤ê¸°
         */
        for (var i=0,oPart; oPart = aParts[i]; i++)
            aPartExprs.push(getExpression(oPart.body));
        
        //////////////////// BEGIN
        
        var sFunc = '';
        var sPushCode = 'aRet.push(oEl); if (oOptions.single) { bStop = true; }';

        for(var i=aParts.length-1, oPart; oPart = aParts[i]; i--) {
            
            var oExpr = aPartExprs[i];
            var sPush = (debugOption.callback ? 'cost++;' : '') + oExpr.defines;
            

            var sReturn = 'if (bStop) {' + (i == 0 ? 'return aRet;' : 'return;') + '}';
            
            if (oExpr.returns == 'true') {
                sPush += (sFunc ? sFunc + '(oEl);' : sPushCode) + sReturn;
            }else{
                sPush += 'if (' + oExpr.returns + ') {' + (sFunc ? sFunc + '(oEl);' : sPushCode ) + sReturn + '}';
            }
            
            var sCheckTag = 'oEl.nodeType != 1';
            if (oExpr.quotTAG) sCheckTag = 'oEl.tagName != ' + oExpr.quotTAG;
            
            var sTmpFunc =
                '(function(oBase' +
                    (i == 0 ? ', oOptions) { var bStop = false; var aRet = [];' : ') {');

            if (oExpr.nth) {
                sPush =
                    'if (isNth_dontShrink(oEl, ' +
                    (oExpr.quotTAG ? oExpr.quotTAG : 'false') + ',' +
                    oExpr.nth[0] + ',' +
                    oExpr.nth[1] + ',' +
                    '"' + (oExpr.nth[2] == 'nth-of-type' ? 'previousSibling' : 'nextSibling') + '")) {' + sPush + '}';
            }
            
            switch (oPart.rel) {
            case ' ':
                if (oExpr.quotID) {
                    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'var oCandi = oEl;' +
                        'for (; oCandi; oCandi = (oCandi.parentNode || oCandi._IE5_parentNode)) {' +
                            'if (oCandi == oBase) break;' +
                        '}' +
                        'if (!oCandi || ' + sCheckTag + ') return aRet;' +
                        sPush;
                    
                } else {
                    
                    sTmpFunc +=
                        'var aCandi = getChilds_dontShrink(oBase, ' + (oExpr.quotTAG || '"*"') + ', ' + (oExpr.quotCLASS || 'null') + ');' +
                        'for (var i = 0, oEl; oEl = aCandi[i]; i++) {' +
                            (oExpr.quotCLASS ? 'if (' + sCheckTag + ') continue;' : '') +
                            sPush +
                        '}';
                    
                }
            
                break;
                
            case '>':
                if (oExpr.quotID) {
    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'if ((oEl.parentNode || oEl._IE5_parentNode) != oBase || ' + sCheckTag + ') return aRet;' +
                        sPush;
                    
                } else {
    
                    sTmpFunc +=
                        'for (var oEl = oBase.firstChild; oEl; oEl = oEl.nextSibling) {' +
                            'if (' + sCheckTag + ') { continue; }' +
                            sPush +
                        '}';
                    
                }
                
                break;
                
            case '+':
                if (oExpr.quotID) {
    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'var oPrev;' +
                        'for (oPrev = oEl.previousSibling; oPrev; oPrev = oPrev.previousSibling) { if (oPrev.nodeType == 1) break; }' +
                        'if (!oPrev || oPrev != oBase || ' + sCheckTag + ') return aRet;' +
                        sPush;
                    
                } else {
    
                    sTmpFunc +=
                        'for (var oEl = oBase.nextSibling; oEl; oEl = oEl.nextSibling) { if (oEl.nodeType == 1) break; }' +
                        'if (!oEl || ' + sCheckTag + ') { return aRet; }' +
                        sPush;
                    
                }
                
                break;
            
            case '~':
    
                if (oExpr.quotID) {
    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'var oCandi = oEl;' +
                        'for (; oCandi; oCandi = oCandi.previousSibling) { if (oCandi == oBase) break; }' +
                        'if (!oCandi || ' + sCheckTag + ') return aRet;' +
                        sPush;
                    
                } else {
    
                    sTmpFunc +=
                        'for (var oEl = oBase.nextSibling; oEl; oEl = oEl.nextSibling) {' +
                            'if (' + sCheckTag + ') { continue; }' +
                            'if (!markElement_dontShrink(oEl, ' + i + ')) { break; }' +
                            sPush +
                        '}';
    
                }
                
                break;
                
            case '!' :
            
                if (oExpr.quotID) {
                    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'for (; oBase; oBase = (oBase.parentNode || oBase._IE5_parentNode)) { if (oBase == oEl) break; }' +
                        'if (!oBase || ' + sCheckTag + ') return aRet;' +
                        sPush;
                        
                } else {
                    
                    sTmpFunc +=
                        'for (var oEl = (oBase.parentNode || oBase._IE5_parentNode); oEl; oEl = oEl && (oEl.parentNode || oEl._IE5_parentNode)) {'+
                            'if (' + sCheckTag + ') { continue; }' +
                            sPush +
                        '}';
                    
                }
                
                break;
    
            case '!>' :
            
                if (oExpr.quotID) {
    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'var oRel = (oBase.parentNode || oBase._IE5_parentNode);' +
                        'if (!oRel || oEl != oRel || (' + sCheckTag + ')) return aRet;' +
                        sPush;
                    
                } else {
    
                    sTmpFunc +=
                        'var oEl = (oBase.parentNode || oBase._IE5_parentNode);' +
                        'if (!oEl || ' + sCheckTag + ') { return aRet; }' +
                        sPush;
                    
                }
                
                break;
                
            case '!+' :
                
                if (oExpr.quotID) {
    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'var oRel;' +
                        'for (oRel = oBase.previousSibling; oRel; oRel = oRel.previousSibling) { if (oRel.nodeType == 1) break; }' +
                        'if (!oRel || oEl != oRel || (' + sCheckTag + ')) return aRet;' +
                        sPush;
                    
                } else {
    
                    sTmpFunc +=
                        'for (oEl = oBase.previousSibling; oEl; oEl = oEl.previousSibling) { if (oEl.nodeType == 1) break; }' +
                        'if (!oEl || ' + sCheckTag + ') { return aRet; }' +
                        sPush;
                    
                }
                
                break;
    
            case '!~' :
                
                if (oExpr.quotID) {
                    
                    sTmpFunc +=
                        // 'var oEl = oDocument_dontShrink.getElementById(' + oExpr.quotID + ');' +
                        'var oEl = GEBID(oBase,' + oExpr.quotID + ',oDocument_dontShrink);' +
                        'var oRel;' +
                        'for (oRel = oBase.previousSibling; oRel; oRel = oRel.previousSibling) { ' +
                            'if (oRel.nodeType != 1) { continue; }' +
                            'if (oRel == oEl) { break; }' +
                        '}' +
                        'if (!oRel || (' + sCheckTag + ')) return aRet;' +
                        sPush;
                    
                } else {
    
                    sTmpFunc +=
                        'for (oEl = oBase.previousSibling; oEl; oEl = oEl.previousSibling) {' +
                            'if (' + sCheckTag + ') { continue; }' +
                            'if (!markElement_dontShrink(oEl, ' + i + ')) { break; }' +
                            sPush +
                        '}';
                    
                }
                
            }
    
            sTmpFunc +=
                (i == 0 ? 'return aRet;' : '') +
            '})';
            
            sFunc = sTmpFunc;
            
        }

        var fpCompiled;
        eval('fpCompiled=' + sFunc + ';');
        return fpCompiled;
        
    };
    
    /*
     ì¿¼ë¦¬ë¥¼ match í•¨ìˆ˜ë¡œ ë³€í™˜
     */
    var parseQuery = function(sQuery) {
        var sCacheKey = sQuery;
        
        var fpSelf = arguments.callee;
        var fpFunction = fpSelf._cache[sCacheKey];
        
        if (!fpFunction) {
            
            sQuery = backupKeys(sQuery);
            
            var aParts = splitToParts(sQuery);
            
            fpFunction = fpSelf._cache[sCacheKey] = compileParts(aParts);
            fpFunction.depth = aParts.length;
            
        }
        
        return fpFunction;
        
    };
    
    parseQuery._cache = {};
    
    /*
     test ì¿¼ë¦¬ë¥¼ match í•¨ìˆ˜ë¡œ ë³€í™˜
     */
    var parseTestQuery = function(sQuery) {
        
        var fpSelf = arguments.callee;
        
        var aSplitQuery = backupKeys(sQuery).split(/\s*,\s*/);
        var aResult = [];
        
        var nLen = aSplitQuery.length;
        var aFunc = [];
        
        for (var i = 0; i < nLen; i++) {

            aFunc.push((function(sQuery) {
                
                var sCacheKey = sQuery;
                var fpFunction = fpSelf._cache[sCacheKey];
                
                if (!fpFunction) {
                    
                    sQuery = backupKeys(sQuery);
                    var oExpr = getExpression(sQuery);
                    
                    eval('fpFunction = function(oEl) { ' + oExpr.defines + 'return (' + oExpr.returnsID + oExpr.returnsTAG + oExpr.returns + '); };');
                    
                }
                
                return fpFunction;
                
            })(restoreKeys(aSplitQuery[i])));
            
        }
        return aFunc;
        
    };
    
    parseTestQuery._cache = {};
    
    var distinct = function(aList) {
    
        var aDistinct = [];
        var oDummy = {};
        
        for (var i = 0, oEl; oEl = aList[i]; i++) {
            
            var nUID = getUID(oEl);
            if (oDummy[nUID]) continue;
            
            aDistinct.push(oEl);
            oDummy[nUID] = true;
        }
    
        return aDistinct;
    
    };
    
    var markElement_dontShrink = function(oEl, nDepth) {
        
        var nUID = getUID(oEl);
        if (cssquery._marked[nDepth][nUID]) return false;
        
        cssquery._marked[nDepth][nUID] = true;
        return true;

    };
    
    var getParentElement = function(oParent){
        if(!oParent) {
            return document;
        }
        
        var nParentNodeType;
        
        oParent = oParent.$value ? oParent.$value() : oParent;
        
        //-@@cssquery-@@//
        if(nv.$Jindo.isString(oParent)){
            try{
                oParent = document.getElementById(oParent);
            }catch(e){
                oParent = document;
            }
        }
        
        nParentNodeType = oParent.nodeType;
        
        if(nParentNodeType != 1 && nParentNodeType != 9 && nParentNodeType != 10 && nParentNodeType != 11){
            oParent = oParent.ownerDocument || oParent.document;
        }
        
        return oParent || oParent.ownerDocument || oParent.document;
    };
    
    var oResultCache = null;
    var bUseResultCache = false;
    var bExtremeMode = false;
        
    var old_cssquery = function(sQuery, oParent, oOptions) {
        var oArgs = g_checkVarType(arguments, {
            '4str'   : [ 'sQuery:String+'],
            '4var'  : [ 'sQuery:String+', 'oParent:Variant' ],
            '4var2' : [ 'sQuery:String+', 'oParent:Variant', 'oOptions:Variant' ]
        },"cssquery");
        
        oParent = getParentElement(oParent);
        oOptions = oOptions && oOptions.$value ? oOptions.$value() : oOptions;
        
        if (typeof sQuery == 'object') {
            
            var oResult = {};
            
            for (var k in sQuery){
                if(sQuery.hasOwnProperty(k))
                    oResult[k] = arguments.callee(sQuery[k], oParent, oOptions);
            }
            
            return oResult;
        }
        
        cost = 0;
        
        var executeTime = new Date().getTime();
        var aRet;
        
        for (var r = 0, rp = debugOption.repeat; r < rp; r++) {
            
            aRet = (function(sQuery, oParent, oOptions) {
                
                if(oOptions){
                    if(!oOptions.oneTimeOffCache){
                        oOptions.oneTimeOffCache = false;
                    }
                }else{
                    oOptions = {oneTimeOffCache:false};
                }
                cssquery.safeHTML(oOptions.oneTimeOffCache);
                
                if (!oParent) oParent = document;
                    
                /*
                 ownerDocument ìž¡ì•„ì£¼ê¸°
                 */
                oDocument_dontShrink = oParent.ownerDocument || oParent.document || oParent;
                
                /*
                 ë¸Œë¼ìš°ì € ë²„ì „ì´ IE5.5 ì´í•˜
                 */
                if (/\bMSIE\s([0-9]+(\.[0-9]+)*);/.test(nv._p_._j_ag) && parseFloat(RegExp.$1) < 6) {
                    try { oDocument_dontShrink.location; } catch(e) { oDocument_dontShrink = document; }
                    
                    oDocument_dontShrink.firstChild = oDocument_dontShrink.getElementsByTagName('html')[0];
                    oDocument_dontShrink.firstChild._IE5_parentNode = oDocument_dontShrink;
                }
                
                /*
                 XMLDocument ì¸ì§€ ì²´í¬
                 */
                bXMLDocument = (typeof XMLDocument !== 'undefined') ? (oDocument_dontShrink.constructor === XMLDocument) : (!oDocument_dontShrink.location);
                getUID = bXMLDocument ? getUID4XML : getUID4HTML;
        
                clearKeys();
                /*
                 ì¿¼ë¦¬ë¥¼ ì‰¼í‘œë¡œ ë‚˜ëˆ„ê¸°
                 */
                var aSplitQuery = backupKeys(sQuery).split(/\s*,\s*/);
                var aResult = [];
                
                var nLen = aSplitQuery.length;
                
                for (var i = 0; i < nLen; i++)
                    aSplitQuery[i] = restoreKeys(aSplitQuery[i]);
                
                /*
                 ì‰¼í‘œë¡œ ë‚˜ëˆ ì§„ ì¿¼ë¦¬ ë£¨í”„
                 */
                for (var i = 0; i < nLen; i++) {
                    
                    var sSingleQuery = aSplitQuery[i];
                    var aSingleQueryResult = null;
                    
                    var sResultCacheKey = sSingleQuery + (oOptions.single ? '_single' : '');
        
                    /*
                     ê²°ê³¼ ìºì‹œ ë’¤ì§
                     */
                    var aCache = bUseResultCache ? oResultCache[sResultCacheKey] : null;
                    if (aCache) {
                        
                        /*
                         ìºì‹±ë˜ì–´ ìžˆëŠ”ê²Œ ìžˆìœ¼ë©´ parent ê°€ ê°™ì€ê±´ì§€ ê²€ì‚¬í•œí›„ aSingleQueryResult ì— ëŒ€ìž…
                         */
                        for (var j = 0, oCache; oCache = aCache[j]; j++) {
                            if (oCache.parent == oParent) {
                                aSingleQueryResult = oCache.result;
                                break;
                            }
                        }
                        
                    }
                    
                    if (!aSingleQueryResult) {
                        
                        var fpFunction = parseQuery(sSingleQuery);
                        
                        cssquery._marked = [];
                        for (var j = 0, nDepth = fpFunction.depth; j < nDepth; j++)
                            cssquery._marked.push({});
                        
                        aSingleQueryResult = distinct(fpFunction(oParent, oOptions));
                        
                        /*
                         ê²°ê³¼ ìºì‹œë¥¼ ì‚¬ìš©ì¤‘ì´ë©´ ìºì‹œì— ì €ìž¥
                         */
                        if (bUseResultCache&&!oOptions.oneTimeOffCache) {
                            if (!(oResultCache[sResultCacheKey] instanceof Array)) oResultCache[sResultCacheKey] = [];
                            oResultCache[sResultCacheKey].push({ parent : oParent, result : aSingleQueryResult });
                        }
                        
                    }
                    
                    aResult = aResult.concat(aSingleQueryResult);
                    
                }
                unsetNodeIndexes();
        
                return aResult;
                
            })(sQuery, oParent, oOptions);
            
        }
        
        executeTime = new Date().getTime() - executeTime;

        if (debugOption.callback) debugOption.callback(sQuery, cost, executeTime);
        
        return aRet;
        
    };
    var cssquery;
    if (document.querySelectorAll) {
        function _isNonStandardQueryButNotException(sQuery){
            return /\[\s*(?:checked|selected|disabled)/.test(sQuery);
        }
        function _commaRevise (sQuery,sChange) {
            return sQuery.replace(/\,/gi,sChange);
        }
        function _startCombinator (sQuery) {
            return /^[~>+]/.test(sQuery);
        }
        function _addQueryId(el, sIdName){
            var sQueryId, sValue;
        
            if(/^\w+$/.test(el.id)){
                sQueryId = "#" + el.id;
            }else{
                sValue = "C" + new Date().getTime() + Math.floor(Math.random() * 1000000);
                el.setAttribute(sIdName, sValue);
                sQueryId = "[" + sIdName + "=" + sValue + "]";
            }
            
            return sQueryId;
        }
        function _getSelectorMethod(sQuery, bDocument) {
            var oRet = { method : null, query : null };

            if(/^\s*[a-z]+\s*$/i.test(sQuery)) {
                oRet.method = "getElementsByTagName";
            } else if(/^\s*([#\.])([\w\-]+)\s*$/i.test(sQuery)) {
                oRet.method = RegExp.$1 == "#" ? "getElementById" : "getElementsByClassName";
                oRet.query = RegExp.$2;
            }
            
            if(!document[oRet.method] || RegExp.$1 == "#" && !bDocument) {
                oRet.method = oRet.query = null;
            }

            return oRet;
        }
        
        var _div = document.createElement("div");

        /**
          @lends $$
         */
        cssquery = function(sQuery, oParent, oOptions){
            var oArgs = g_checkVarType(arguments, {
                '4str'   : [ 'sQuery:String+'],
                '4var'  : [ 'sQuery:String+', 'oParent:Variant' ],
                '4var2' : [ 'sQuery:String+', 'oParent:Variant', 'oOptions:Variant' ]
            },"cssquery"),
            sTempId, aRet, nParentNodeType, bUseQueryId, oOldParent, queryid, _clone, sTagName, _parent, vSelectorMethod, sQueryAttrName = "queryid";
            
            oParent = getParentElement(oParent);
            oOptions = oOptions && oOptions.$value ? oOptions.$value() : oOptions;
            
            /*
            	[key=val]ì¼ ë•Œ valê°€ ìˆ«ìžì´ë©´  ''ë¡œ ë¬¶ì–´ì£¼ëŠ” ë¡œì§
            */
            var re = /\[(.*?)=([\w\d]*)\]/g;

            if(re.test(sQuery)) {
                sQuery = sQuery.replace(re, "[$1='$2']");
            }
            
            nParentNodeType = oParent.nodeType;
            
            try{
                if(_isNonStandardQueryButNotException(sQuery)){
                    return old_cssquery(sQuery, oParent, oOptions);
                }
                sTagName = (oParent.tagName||"").toUpperCase();
                
                vSelectorMethod = _getSelectorMethod(sQuery, nParentNodeType == 9);

                if(vSelectorMethod.query) {
                    sQuery = vSelectorMethod.query;
                }
                
                vSelectorMethod = vSelectorMethod.method;

                if(nParentNodeType!==9&&sTagName!="HTML"){
                    if(nParentNodeType === 11){
                        /*
                        	documentFragmentì¼ ë•Œ ëŠ” ë³µì‚¬í•´ì„œ ì°¾ìŒ.
                        */
                        oParent = oParent.cloneNode(true);
                        _clone = _div.cloneNode(true);
                        _clone.appendChild(oParent);
                        oParent = _clone;
                        _clone = null;
                    }
                    
                    if(!vSelectorMethod) {                      
                        bUseQueryId = true;
                        queryid = _addQueryId(oParent, sQueryAttrName);
                        sQuery = _commaRevise(queryid+" "+ sQuery,", "+queryid+" ");
                    }

                    if((_parent = oParent.parentNode) || sTagName === "BODY" || nv.$Element._contain((oParent.ownerDocument || oParent.document).body,oParent)) {
                        /*
                        	ë”ì´ ë¶™ì€ ê²½ìš°ëŠ” ìƒìœ„ ì—˜ë¦¬ë¨¼íŠ¸ë¥¼ ê¸°ì¤€ìœ¼ë¡œ
                        */
                        if(!vSelectorMethod) {
                            oOldParent = oParent;
                            oParent = _parent;
                        }
                        
                    } else if(!vSelectorMethod) {
                        /*
                        	ë”ì´ ë–¨ì–´ì§„ ê²½ìš°ì—ëŠ” ìƒìœ„ ì—˜ë¦¬ë¨¼íŠ¸ë¥¼ ë§Œë“¤ì–´ì„œ íƒìƒ‰.
                        */
                        _clone = _div.cloneNode(true);
                        // id = oParent.id;
                        oOldParent = oParent;
                        _clone.appendChild(oOldParent);
                        oParent = _clone;
                    }

                } else {
                    oParent = (oParent.ownerDocument || oParent.document||oParent);
                    if(_startCombinator(sQuery)) return [];
                }

                if(oOptions&&oOptions.single) {
                    if(vSelectorMethod) {
                        aRet = oParent[vSelectorMethod](sQuery);
                        aRet = [ vSelectorMethod == "getElementById" ? aRet : aRet[0] ];
                    } else {
                        aRet = [ oParent.querySelector(sQuery) ];
                    }

                } else {
                    if(vSelectorMethod) {
                        aRet = oParent[vSelectorMethod](sQuery);

                        if(vSelectorMethod == "getElementById") {
                            aRet = aRet ? [aRet] : [];
                        }
                    } else {
                        aRet = oParent.querySelectorAll(sQuery);    
                    }
                    
                    aRet = nv._p_._toArray(aRet);
                }
                
            } catch(e) {
                aRet =  old_cssquery(sQuery, oParent, oOptions);
            }

            if(bUseQueryId){
                oOldParent.removeAttribute(sQueryAttrName);
                _clone = null;
            }
            return aRet;
        };
    }else{
        cssquery = old_cssquery;
    }
    /**
     	test() ë©”ì„œë“œëŠ” íŠ¹ì • ìš”ì†Œê°€ í•´ë‹¹ CSS ì„ íƒìž(CSS Selector)ì— ë¶€í•©í•˜ëŠ” ìš”ì†Œì¸ì§€ íŒë‹¨í•˜ì—¬ Boolean í˜•íƒœë¡œ ë°˜í™˜í•œë‹¤.
	
	@method $$.test
	@static
	@param {Element+} element ê²€ì‚¬í•˜ê³ ìž í•˜ëŠ” ìš”ì†Œ
	@param {String+} sCSSSelector CSS ì„ íƒìž. CSS ì„ íƒìžë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” íŒ¨í„´ì€ í‘œì¤€ íŒ¨í„´ê³¼ ë¹„í‘œì¤€ íŒ¨í„´ì´ ìžˆë‹¤. í‘œì¤€ íŒ¨í„´ì€ CSS Level3 ëª…ì„¸ì„œì— ìžˆëŠ” íŒ¨í„´ì„ ì§€ì›í•œë‹¤.
	@return {Boolean} ì¡°ê±´ì— ë¶€í•©í•˜ë©´ true, ë¶€í•©í•˜ì§€ ì•Šìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@remark 
		<ul class="disc">
			<li>CSS ì„ íƒìžì— ì—°ê²°ìžëŠ” ì‚¬ìš©í•  ìˆ˜ ì—†ìŒì— ìœ ì˜í•œë‹¤.</li>
			<li>ì„ íƒìžì˜ íŒ¨í„´ì— ëŒ€í•œ ì„¤ëª…ì€ $$() í•¨ìˆ˜ì™€ See Also í•­ëª©ì„ ì°¸ê³ í•œë‹¤.</li>
		</ul>
	@see nv.$$
	@see http://www.w3.org/TR/css3-selectors/ CSS Level3 ëª…ì„¸ì„œ - W3C
	@example
		// oEl ì´ div íƒœê·¸ ë˜ëŠ” p íƒœê·¸, ë˜ëŠ” align ì†ì„±ì´ centerë¡œ ì§€ì •ëœ ìš”ì†Œì¸ì§€ ê²€ì‚¬í•œë‹¤.
		if (cssquery.test(oEl, 'div, p, [align=center]'))
		alert('í•´ë‹¹ ì¡°ê±´ ë§Œì¡±');
     */
    cssquery.test = function(oEl, sQuery) {
        clearKeys();
        try{
            var oArgs = g_checkVarType(arguments, {
                '4ele' : [ 'oEl:Element+', 'sQuery:String+' ],
                '4doc' : [ 'oEl:Document+', 'sQuery:String+' ]
            },"<static> cssquery#test");
            oEl = oArgs.oEl;
            sQuery = oArgs.sQuery;
        }catch(e){
            return false;
        }

        var aFunc = parseTestQuery(sQuery);

        for (var i = 0, nLen = aFunc.length; i < nLen; i++){
            if (aFunc[i](oEl)) return true;
        }

        return false;
    };

    /**
     	useCache() ë©”ì„œë“œëŠ” $$() í•¨ìˆ˜(cssquery)ë¥¼ ì‚¬ìš©í•  ë•Œ ìºì‹œë¥¼ ì‚¬ìš©í•  ê²ƒì¸ì§€ ì„¤ì •í•œë‹¤. ìºì‹œë¥¼ ì‚¬ìš©í•˜ë©´ ë™ì¼í•œ ì„ íƒìžë¡œ íƒìƒ‰í•˜ëŠ” ê²½ìš° íƒìƒ‰í•˜ì§€ ì•Šê³  ê¸°ì¡´ íƒìƒ‰ ê²°ê³¼ë¥¼ ë°˜í™˜í•œë‹¤. ë”°ë¼ì„œ ì‚¬ìš©ìžê°€ ë³€ìˆ˜ ìºì‹œë¥¼ ì‹ ê²½ì“°ì§€ ì•Šê³  íŽ¸í•˜ê³  ë¹ ë¥´ê²Œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” ìž¥ì ì´ ìžˆì§€ë§Œ ì‹ ë¢°ì„±ì„ ìœ„í•´ DOM êµ¬ì¡°ê°€ ë™ì ìœ¼ë¡œ ë³€í•˜ì§€ ì•Šì„ ë•Œë§Œ ì‚¬ìš©í•´ì•¼ í•œë‹¤.
	
	@method $$.useCache
	@static
	@param {Boolean} [bFlag] ìºï¿½ï¿½ï¿½ ì‚¬ìš© ì—¬ë¶€ë¥¼ ì§€ì •í•œë‹¤. ì´ íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ ìºì‹œ ì‚¬ìš© ìƒíƒœë§Œ ë°˜í™˜í•œë‹¤.
	@return {Boolean} ìºì‹œ ì‚¬ìš© ìƒíƒœë¥¼ ë°˜í™˜í•œë‹¤.
	@see nv.$$.clearCache
     */
    cssquery.useCache = function(bFlag) {
    
        if (bFlag !== undefined) {
            bUseResultCache = bFlag;
            cssquery.clearCache();
        }
        
        return bUseResultCache;
        
    };
    
    /**
     	clearCache() ë©”ì„œë“œëŠ” $$() í•¨ìˆ˜(cssquery)ì—ì„œ ìºì‹œë¥¼ ì‚¬ìš©í•  ë•Œ ìºì‹œë¥¼ ë¹„ìš¸ ë•Œ ì‚¬ìš©í•œë‹¤. DOM êµ¬ì¡°ê°€ ë™ì ìœ¼ë¡œ ë°”ê»´ ê¸°ì¡´ì˜ ìºì‹œ ë°ì´í„°ê°€ ì‹ ë¢°ì„±ì´ ì—†ì„ ë•Œ ì‚¬ìš©í•œë‹¤.
	
	@method $$.clearCache
	@static
	@see nv.$$.useCache
     */
    cssquery.clearCache = function() {
        oResultCache = {};
    };
    
    /**
     	getSingle() ë©”ì„œë“œëŠ” CSS ì„ íƒìžë¥¼ ì‚¬ìš©ì—ì„œ ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” ì²« ë²ˆì§¸ ìš”ì†Œë¥¼ ê°€ì ¸ì˜¨ë‹¤. ë°˜í™˜í•˜ëŠ” ê°’ì€ ë°°ì—´ì´ ì•„ë‹Œ ê°ì±„ ë˜ëŠ” nullì´ë‹¤. ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” ìš”ì†Œë¥¼ ì°¾ìœ¼ë©´ ë°”ë¡œ íƒìƒ‰ ìž‘ì—…ì„ ì¤‘ë‹¨í•˜ê¸° ë•Œë¬¸ì— ê²°ê³¼ê°€ í•˜ë‚˜ë¼ëŠ” ë³´ìž¥ì´ ìžˆì„ ë•Œ ë¹ ë¥¸ ì†ë„ë¡œ ê²°ê³¼ë¥¼ ê°€ì ¸ì˜¬ ìˆ˜ ìžˆë‹¤.
	
	@method $$.getSingle
	@static
	@syntax sSelector, oBaseElement, oOption
	@syntax sSelector, sBaseElement, oOption
	@param {String+} sSelector CSS ì„ íƒìž(CSS Selector). CSS ì„ íƒìžë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” íŒ¨í„´ì€ í‘œì¤€ íŒ¨í„´ê³¼ ë¹„í‘œì¤€ íŒ¨í„´ì´ ìžˆë‹¤. í‘œì¤€ íŒ¨í„´ì€ CSS3 Level3 ëª…ì„¸ì„œì— ìžˆëŠ” íŒ¨í„´ì„ ì§€ì›í•œë‹¤. ì„ íƒìžì˜ íŒ¨í„´ì— ëŒ€í•œ ì„¤ëª…ì€ $$() í•¨ìˆ˜ì™€ See Also í•­ëª©ì„ ì°¸ê³ í•œë‹¤.
	@param {Element+} [oBaseElement] íƒìƒ‰ ëŒ€ìƒì´ ë˜ëŠ” DOM ìš”ì†Œ. ì§€ì •í•œ ìš”ì†Œì˜ í•˜ìœ„ ë…¸ë“œì—ì„œë§Œ ê°ì²´ë¥¼ íƒìƒ‰í•œë‹¤. ìƒëžµë  ê²½ìš° ë¬¸ì„œë¥¼ ëŒ€ìƒìœ¼ë¡œ ì°¾ëŠ”ë‹¤.
	@param {Hash+} [oOption] ì˜µì…˜ ê°ì²´ì— oneTimeOffCache ì†ì„±ì„ trueë¡œ ì„¤ì •í•˜ë©´ íƒìƒ‰í•  ë•Œ ìºì‹œë¥¼ ì‚¬ìš©í•˜ì§€ ì•ŠëŠ”ë‹¤.
	@param {String+} [sBaseElement] íƒìƒ‰ ëŒ€ìƒì´ ë˜ëŠ” DOM ìš”ì†Œì˜ ID. ì§€ì •í•œ ìš”ì†Œì˜ í•˜ìœ„ ë…¸ë“œì—ì„œë§Œ ê°ì²´ë¥¼ íƒìƒ‰í•œë‹¤. ìƒëžµë  ê²½ìš° ë¬¸ì„œë¥¼ ëŒ€ìƒìœ¼ë¡œ ì°¾ëŠ”ë‹¤.  IDë¥¼ ë„£ì„ ìˆ˜ ìžˆë‹¤.
	@return {Element | Boolean} ì„ íƒëœ ìš”ì†Œ. ê²°ê³¼ê°€ ì—†ìœ¼ë©´ nullì„ ë°˜í™˜í•œë‹¤.
	@see nv.$Document#query	 
	@see nv.$$.useCache
	@see nv.$$
	@see http://www.w3.org/TR/css3-selectors/ CSS Level3 ëª…ì„¸ì„œ - W3C
     */
    cssquery.getSingle = function(sQuery, oParent, oOptions) {

        oOptions = oOptions && oOptions.$value ? oOptions.$value() : oOptions; 

        return cssquery(sQuery, oParent, {
            single : true ,
            oneTimeOffCache:oOptions?(!!oOptions.oneTimeOffCache):false
        })[0] || null;
    };
    
    
    /**
     	xpath() ë©”ì„œë“œëŠ” XPath ë¬¸ë²•ì„ ë§Œì¡±í•˜ëŠ” ìš”ì†Œë¥¼ ê°€ì ¸ì˜¨ë‹¤. ì§€ì›í•˜ëŠ” ë¬¸ë²•ì´ ì œí•œì ì´ë¯€ë¡œ íŠ¹ìˆ˜í•œ ê²½ìš°ì—ë§Œ ì‚¬ìš©í•  ê²ƒì„ ê¶Œìž¥í•œë‹¤.
	
	@method $$.xpath
	@static
	@param {String+} sXPath XPath ê°’.
	@param {Element} [elBaseElement] íƒìƒ‰ ëŒ€ìƒì´ ë˜ëŠ” DOM ìš”ì†Œ. ì§€ì •í•œ ìš”ì†Œì˜ í•˜ìœ„ ë…¸ë“œì—ì„œë§Œ ê°ì²´ë¥¼ íƒìƒ‰í•œë‹¤. 
	@return {Array | Boolean} XPath ë¬¸ë²•ì„ ë§Œì¡±í•˜ëŠ” ìš”ì†Œë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´. ê²°ê³¼ê°€ ì—†ìœ¼ë©´ nullì„ ë°˜í™˜í•œë‹¤.
	@filter desktop
	@see nv.$Document#xpathAll
	@see http://www.w3.org/standards/techs/xpath#w3c_all XPath ë¬¸ì„œ - W3C
     */
    cssquery.xpath = function(sXPath, oParent) {
        sXPath = sXPath && sXPath.$value ? sXPath.$value() : sXPath; 
        
        sXPath = sXPath.replace(/\/(\w+)(\[([0-9]+)\])?/g, function(_1, sTag, _2, sTh) {
            sTh = sTh || '1';
            return '>' + sTag + ':nth-of-type(' + sTh + ')';
        });
        
        return old_cssquery(sXPath, oParent);
    };
    
    /**
     	debug() ë©”ì„œë“œëŠ” $$() í•¨ìˆ˜(cssquery)ë¥¼ ì‚¬ìš©í•  ë•Œ ì„±ëŠ¥ì„ ì¸¡ì •í•˜ê¸° ìœ„í•œ ê¸°ëŠ¥ì„ ì œê³µí•˜ëŠ” í•¨ìˆ˜ì´ë‹¤. íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥í•œ ì½œë°± í•¨ìˆ˜ë¥¼ ì‚¬ìš©í•˜ì—¬ ì„±ëŠ¥ì„ ì¸¡ì •í•œë‹¤.
	
	@method $$.debug
	@static
	@param {Function} fCallback ì„ íƒìž ì‹¤í–‰ì— ì†Œìš”ëœ ë¹„ìš©ê³¼ ì‹œê°„ì„ ì ê²€í•˜ëŠ” í•¨ìˆ˜. ì´ íŒŒë¼ë¯¸í„°ì— í•¨ìˆ˜ ëŒ€ì‹  falseë¥¼ ìž…ë ¥í•˜ë©´ ì„±ëŠ¥ ì¸¡ì • ëª¨ë“œ(debug)ë¥¼ ì‚¬ìš©í•˜ì§€ ì•ŠëŠ”ë‹¤.
	@param {Numeric} [nRepeat] í•˜ë‚˜ì˜ ì„ íƒìžë¥¼ ë°˜ë³µ ìˆ˜í–‰í•  íšŸìˆ˜. ì¸ìœ„ì ìœ¼ë¡œ ì‹¤í–‰ ì†ë„ë¥¼ ëŠ¦ì¶”ê¸° ìœ„í•´ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	@filter desktop
	@remark ì½œë°± í•¨ìˆ˜ fCallbackëŠ” íŒŒë¼ë¯¸í„°ë¡œ query, cost, executeTimeì„ ê°–ëŠ”ë‹¤.<br>
		<ul class="disc">
			<li>queryëŠ” ì‹¤í–‰ì— ì‚¬ìš©ëœ ì„ íƒìžì´ë‹¤.</li>
			<li>indexëŠ” íƒìƒ‰ì— ì‚¬ìš©ëœ ë¹„ìš©ì´ë‹¤(ë£¨í”„ íšŸìˆ˜).</li>
			<li>executeTime íƒìƒ‰ì— ì†Œìš”ëœ ì‹œê°„ì´ë‹¤.</li>
		</ul>
	@example
		cssquery.debug(function(sQuery, nCost, nExecuteTime) {
			if (nCost > 5000)
				console.warn('5000ì´ ë„˜ëŠ” ë¹„ìš©ì´? í™•ì¸ -> ' + sQuery + '/' + nCost);
			else if (nExecuteTime > 200)
				console.warn('0.2ì´ˆê°€ ë„˜ê²Œ ì‹¤í–‰ì„? í™•ì¸ -> ' + sQuery + '/' + nExecuteTime);
		}, 20);
		
		....
		
		cssquery.debug(false);
     */
    cssquery.debug = function(fpCallback, nRepeat) {
        
        var oArgs = g_checkVarType(arguments, {
            '4fun'   : [ 'fpCallback:Function+'],
            '4fun2'  : [ 'fpCallback:Function+', 'nRepeat:Numeric' ]
        },"<static> cssquery#debug");

        debugOption.callback = oArgs.fpCallback;
        debugOption.repeat = oArgs.nRepeat || 1;
        
    };
    
    /**
     	safeHTML() ë©”ì„œë“œëŠ” ì¸í„°ë„· ìµìŠ¤í”Œë¡œëŸ¬ì—ì„œ innerHTML ì†ì„±ì„ ì‚¬ìš©í•  ë•Œ _cssquery_UID ê°’ì´ ë‚˜ì˜¤ì§€ ì•Šê²Œ í•˜ëŠ” í•¨ìˆ˜ì´ë‹¤. trueë¡œ ì„¤ì •í•˜ë©´ íƒìƒ‰í•˜ëŠ” ë…¸ë“œì˜ innerHTML ì†ì„±ì— _cssquery_UIDê°€ ë‚˜ì˜¤ì§€ ì•Šê²Œ í•  ìˆ˜ ìžˆì§€ë§Œ íƒìƒ‰ ì†ë„ëŠ” ëŠë ¤ì§ˆ ìˆ˜ ìžˆë‹¤.
	
	@method $$.safeHTML
	@static
	@param {Boolean} bFlag _cssquery_UIDì˜ í‘œì‹œ ì—¬ë¶€ë¥¼ ì§€ì •í•œë‹¤. trueë¡œ ì„¤ì •í•˜ë©´ _cssquery_UIDê°€ ë‚˜ì˜¤ì§€ ì•ŠëŠ”ë‹¤.
	@return {Boolean} _cssquery_UID í‘œì‹œ ì—¬ë¶€ ìƒíƒœë¥¼ ë°˜í™˜í•œë‹¤. _cssquery_UIDë¥¼ í‘œì‹œí•˜ëŠ” ìƒíƒœì´ë©´ trueë¥¼ ë°˜í™˜í•˜ê³  ê·¸ë ‡ì§€ ì•Šìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@filter desktop
     */
    cssquery.safeHTML = function(bFlag) {
        
        if (arguments.length > 0)
            safeHTML = bFlag && nv._p_._JINDO_IS_IE;
        
        return safeHTML || !nv._p_._JINDO_IS_IE;
        
    };
    
    /**
     	version ì†ì„±ì€ cssqueryì˜ ë²„ì „ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ë¬¸ìžì—´ì´ë‹¤.
	
	@property $$.version
	@type String
	@field
	@static
	@filter desktop
     */
    cssquery.version = sVersion;
    
    /**
     	IEì—ì„œ validUID,cacheë¥¼ ì‚¬ìš©í–ˆì„ë•Œ ë©”ëª¨ë¦¬ ë‹‰ì´ ë°œìƒí•˜ì—¬ ì‚­ì œí•˜ëŠ” ëª¨ë“ˆ ì¶”ê°€.x
     */
    cssquery.release = function() {
        if(nv._p_._JINDO_IS_IE) {
            delete validUID;
            validUID = {};
            
            if(bUseResultCache){
                cssquery.clearCache();
            }
        }
    };
    /**
     	cacheê°€ ì‚­ì œê°€ ë˜ëŠ”ì§€ í™•ì¸í•˜ê¸° ìœ„í•´ í•„ìš”í•œ í•¨ìˆ˜
	
	@method $$._getCacheInfo
	@filter desktop
	@ignore
     */
    cssquery._getCacheInfo = function(){
        return {
            uidCache : validUID,
            eleCache : oResultCache 
        };
    };
    /**
     	í…ŒìŠ¤íŠ¸ë¥¼ ìœ„í•´ í•„ìš”í•œ í•¨ìˆ˜
	
	@method $$._resetUID
	@filter desktop
	@ignore
     */
    cssquery._resetUID = function(){
        UID = 0;
    };
    /**
     	querySelectorê°€ ìžˆëŠ” ë¸Œë¼ìš°ì ¸ì—ì„œ extremeì„ ì‹¤í–‰ì‹œí‚¤ë©´ querySelectorì„ ì‚¬ìš©í• ìˆ˜ ìžˆëŠ” ì»¤ë²„ë¦¬ì§€ê°€ ë†’ì•„ì ¸ ì „ì²´ì ìœ¼ë¡œ ì†ë„ê°€ ë¹¨ë¦¬ì§„ë‹¤.
	í•˜ì§€ë§Œ IDê°€ ì—†ëŠ” ì—˜ë¦¬ë¨¼íŠ¸ë¥¼ ê¸°ì¤€ ì—˜ë¦¬ë¨¼íŠ¸ë¡œ ë„£ì—ˆì„ ë•Œ ê¸°ì¤€ ì—˜ë¦¬ë¨¼íŠ¸ì— ìž„ì˜ì˜ ì•„ì´ë””ê°€ ë“¤ì–´ê°„ë‹¤.
	
	@method $$.extreme
	@static
	@ignore
	@param {Boolean} bExtreme true
     */
    cssquery.extreme = function(bExtreme){
        if(arguments.length == 0){
            bExtreme = true;
        }
        bExtremeMode = bExtreme;
    };

    return cssquery;
    
})();
//-!nv.cssquery end!-//
//-!nv.$$.hidden start(nv.cssquery)!-//
//-!nv.$$.hidden end!-//

/**
 * 
	@fileOverview nv.$Agent() ê°ì²´ì˜ ìƒì„±ìž ë° ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name core.js
	@author NAVER Ajax Platform
 */

//-!nv.$Agent start!-//
/**
	nv.$Agent() ê°ì²´ëŠ” ìš´ì˜ì²´ì œ, ë¸Œë¼ìš°ì €ë¥¼ ë¹„ë¡¯í•œ ì‚¬ìš©ìž ì‹œìŠ¤í…œ ì •ë³´ë¥¼ ì œê³µí•œë‹¤.
	
	@class nv.$Agent
	@keyword agent, ì—ì´ì „íŠ¸
 */
/**
	nv.$Agent() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤. nv.$Agent() ê°ì²´ëŠ” ì‚¬ìš©ìž ì‹œìŠ¤í…œì˜ ìš´ì˜ ì²´ì œ ì •ë³´ì™€ ë¸Œë¼ìš°ì € ì •ë³´ë¥¼ ì œê³µí•œë‹¤.
	
	@constructor
 */
nv.$Agent = function() {
	//-@@$Agent-@@//
	var cl = arguments.callee;
	var cc = cl._cached;

	if (cc) return cc;
	if (!(this instanceof cl)) return new cl;
	if (!cc) cl._cached = this;

	this._navigator = navigator;
	this._dm = document.documentMode;
};
//-!nv.$Agent end!-//

//-!nv.$Agent.prototype.navigator start!-//
/**
	navigator() ë©”ì„œë“œëŠ” ì‚¬ìš©ìž ë¸Œë¼ìš°ì € ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method navigator
	@return {Object} ë¸Œë¼ìš°ì € ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´.
	@remark 
		<ul class="disc">
			<li>1.4.3 ë²„ì „ë¶€í„° mobile,msafari,mopera,mie ì‚¬ìš© ê°€ëŠ¥.</li>
			<li>1.4.5 ë²„ì „ë¶€í„° ipadì—ì„œ mobileì€ falseë¥¼ ë°˜í™˜í•œë‹¤.</li>
		</ul><br>
		ë¸Œë¼ìš°ì € ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´ëŠ” ë¸Œë¼ìš°ì € ì´ë¦„ê³¼ ë²„ì „ì„ ì†ì„±ìœ¼ë¡œ ê°€ì§„ë‹¤. ë¸Œë¼ìš°ì € ì´ë¦„ì€ ì˜ì–´ ì†Œë¬¸ìžë¡œ í‘œì‹œí•˜ë©°, ì‚¬ìš©ìžì˜ ë¸Œë¼ìš°ì €ì™€ ì¼ì¹˜í•˜ëŠ” ë¸Œë¼ìš°ì € ì†ì„±ì€ true ê°’ì„ ê°€ì§„ë‹¤. 
		ë˜í•œ, ì‚¬ìš©ìžì˜ ë¸Œë¼ìš°ì € ì´ë¦„ì„ í™•ì¸í•  ìˆ˜ ìžˆë„ë¡ ë©”ì„œë“œë¥¼ ì œê³µí•œë‹¤. ë‹¤ìŒì€ ì‚¬ìš©ìž ë¸Œë¼ìš°ì € ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ì˜ ì†ì„±ê³¼ ë©”ì„œë“œë¥¼ ì„¤ëª…í•œ í‘œì´ë‹¤.<br>
		<h5>ë¸Œë¼ìš°ì € ì •ë³´ ê°ì²´ ì†ì„±</h5>
		<table class="tbl_board">
			<caption class="hide">ë¸Œë¼ìš°ì € ì •ë³´ ê°ì²´ ì†ì„±</caption>
			<thead>
				<tr>
					<th scope="col" style="width:15%">ì´ë¦„</th>
					<th scope="col" style="width:15%">íƒ€ìž…</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">camino</td>
					<td>Boolean</td>
					<td class="txt">ì¹´ë¯¸ë…¸(Camino) ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">chrome</td>
					<td>Boolean</td>
					<td class="txt">êµ¬ê¸€ í¬ë¡¬(Chrome) ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">firefox</td>
					<td>Boolean</td>
					<td class="txt">íŒŒì´ì–´í­ìŠ¤(Firefox) ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤. </td>
				</tr>
				<tr>
					<td class="txt bold">icab</td>
					<td>Boolean</td>
					<td class="txt">iCab ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">ie</td>
					<td>Boolean</td>
					<td class="txt">ì¸í„°ë„· ìµìŠ¤í”Œë¡œëŸ¬(Internet Explorer) ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">konqueror</td>
					<td>Boolean</td>
					<td class="txt">Konqueror ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">mie</td>
					<td>Boolean</td>
					<td class="txt">ì¸í„°ë„· ìµìŠ¤í”Œë¡œëŸ¬ ëª¨ë°”ì¼(Internet Explorer Mobile) ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">mobile</td>
					<td>Boolean</td>
					<td class="txt">ëª¨ë°”ì¼ ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">mozilla</td>
					<td>Boolean</td>
					<td class="txt">ëª¨ì§ˆë¼(Mozilla) ê³„ì—´ì˜ ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">msafari</td>
					<td>Boolean</td>
					<td class="txt">Mobile ë²„ì „ Safari ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">nativeVersion</td>
					<td>Number</td>
					<td class="txt">ì¸í„°ë„· ìµìŠ¤í”Œë¡œëŸ¬ í˜¸í™˜ ëª¨ë“œì˜ ë¸Œë¼ìš°ì €ë¥¼ ì‚¬ìš©í•  ê²½ìš° ì‹¤ì œ ë¸Œë¼ìš°ì €ë¥¼ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">netscape</td>
					<td>Boolean</td>
					<td class="txt">ë„·ìŠ¤ì¼€ì´í”„(Netscape) ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">omniweb</td>
					<td>Boolean</td>
					<td class="txt">OmniWeb ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">opera</td>
					<td>Boolean</td>
					<td class="txt">ì˜¤íŽ˜ë¼(Opera) ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">safari</td>
					<td>Boolean</td>
					<td class="txt">Safari ë¸Œë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">webkit</td>
					<td>Number</td>
					<td class="txt">WebKit ê³„ì—´ ë¶€ë¼ìš°ì € ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤. </td>
				</tr>
				<tr>
					<td class="txt bold">version</td>
					<td>Number</td>
					<td class="txt">ì‚¬ìš©ìžê°€ ì‚¬ìš©í•˜ê³  ìžˆëŠ” ë¸Œë¼ìš°ì €ì˜ ë²„ì „ ì •ë³´ë¥¼ ì €ìž¥í•œë‹¤. ì‹¤ìˆ˜(Float) í˜•íƒœë¡œ ë²„ì „ ì •ë³´ë¥¼ ì €ìž¥í•˜ë©° ë²„ì „ ì •ë³´ê°€ ì—†ìœ¼ë©´ -1 ê°’ì„ ê°€ì§„ë‹¤.</td>
				</tr>
			</tbody>
		</table>
		<h5>ë¸Œë¼ìš°ì € ì •ë³´ ê°ì²´ ë©”ì„œë“œ</h5>
		<table class="tbl_board">
			<caption class="hide">ë¸Œë¼ìš°ì € ì •ë³´ ê°ì²´ ë©”ì„œë“œ</caption>
			<thead>
				<tr>
					<th scope="col" style="width:15%">ì´ë¦„</th>
					<th scope="col" style="width:15%">ë°˜í™˜ íƒ€ìž…</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">getName()</td>
					<td>String</td>
					<td class="txt">ì‚¬ìš©ìžê°€ ì‚¬ìš©í•˜ê³  ìžˆëŠ” ë¸Œë¼ìš°ì €ì˜ ì´ë¦„ì„ ë°˜í™˜í•œë‹¤. ë°˜í™˜í•˜ëŠ” ë¸Œë¼ìš°ì €ì˜ ì´ë¦„ì€ ì†ì„± ì´ë¦„ê³¼ ë™ì¼í•˜ë‹¤.</td>
				</tr>
			</tbody>
		</table>
	@example
		oAgent = $Agent().navigator(); // ì‚¬ìš©ìžê°€ íŒŒì´ì–´í­ìŠ¤ 3ë¥¼ ì‚¬ìš©í•œë‹¤ê³  ê°€ì •í•œë‹¤.
		
		oAgent.camino  // false
		oAgent.firefox  // true
		oAgent.konqueror // false
		oAgent.mozilla  //true
		oAgent.netscape  // false
		oAgent.omniweb  //false
		oAgent.opera  //false
		oAgent.webkit  /false
		oAgent.safari  //false
		oAgent.ie  //false
		oAgent.chrome  //false
		oAgent.icab  //false
		oAgent.version  //3
		oAgent.nativeVersion // -1 (1.4.2ë¶€í„° ì‚¬ìš© ê°€ëŠ¥, IE8ì—ì„œ í˜¸í™˜ ëª¨ë“œ ì‚¬ìš©ì‹œ nativeVersionì€ 8ë¡œ ë‚˜ì˜´.)
		
		oAgent.getName() // firefox
 */
nv.$Agent.prototype.navigator = function() {
	//-@@$Agent.navigator-@@//
	var info = {},
		ver = -1,
		nativeVersion = -1,
		u = this._navigator.userAgent,
		v = this._navigator.vendor || "",
		dm = this._dm;

	function f(s,h){
		return ((h || "").indexOf(s) > -1);
	}

	info.getName = function(){
		var name = "";
		for(var x in info){
			if(x !=="mobile" && typeof info[x] == "boolean" && info[x] && info.hasOwnProperty(x))
				name = x;
		}
		return name;
	};

	info.webkit = f("WebKit", u);
	info.opera = (window.opera !== undefined) || f("Opera", u) || f("OPR", u);
	info.ie = !info.opera && (f("MSIE", u)||f("Trident", u));
	info.chrome = info.webkit && !info.opera && f("Chrome", u) || f("CriOS", u);
	info.safari = info.webkit && !info.chrome && !info.opera && f("Apple", v);
	info.firefox = f("Firefox", u);
	info.mozilla = f("Gecko", u) && !info.safari && !info.chrome && !info.firefox && !info.ie;
	info.camino = f("Camino", v);
	info.netscape = f("Netscape", u);
	info.omniweb = f("OmniWeb", u);
	info.icab = f("iCab", v);
	info.konqueror = f("KDE", v);
	info.mobile = (f("Mobile", u) || f("Android", u) || f("Nokia", u) || f("webOS", u) || f("Opera Mini", u) || f("Opera Mobile", u) || f("BlackBerry", u) || (f("Windows", u) && f("PPC", u)) || f("Smartphone", u) || f("IEMobile", u)) && !(f("iPad", u) || f("Tablet", u));
	info.msafari = ((!f("IEMobile", u) && f("Mobile", u)) || (f("iPad", u) && f("Safari", u))) && !info.chrome && !info.opera && !info.firefox;
	info.mopera = f("Opera Mini", u);
	info.mie = f("PPC", u) || f("Smartphone", u) || f("IEMobile", u);

	try{
		if(info.ie){
			if(dm > 0){
				ver = dm;
				if(u.match(/(?:Trident)\/([\d.]+)/)){
					var nTridentNum = parseFloat(RegExp.$1, 10);
					
					if(nTridentNum > 3){
						nativeVersion = nTridentNum + 4;
					}
				}else{
					nativeVersion = ver;
				}
			}else{
				nativeVersion = ver = u.match(/(?:MSIE) ([\d.]+)/)[1];
			}
		}else if(info.safari || info.msafari){
			ver = parseFloat(u.match(/Safari\/([\d.]+)/)[1]);

			if(ver == 100){
				ver = 1.1;
			}else{
				if(u.match(/Version\/([\d.]+)/)){
					ver = RegExp.$1;
				}else{
					ver = [1.0, 1.2, -1, 1.3, 2.0, 3.0][Math.floor(ver / 100)];
				}
			}
        } else if(info.mopera) {
            ver = u.match(/(?:Opera\sMini)\/([\d.]+)/)[1];
        } else if(info.opera) {
            ver = u.match(/(?:Version|OPR|Opera)[\/\s]?([\d.]+)(?!.*Version)/)[1];
		}else if(info.firefox||info.omniweb){
			ver = u.match(/(?:Firefox|OmniWeb)\/([\d.]+)/)[1];
		}else if(info.mozilla){
			ver = u.match(/rv:([\d.]+)/)[1];
		}else if(info.icab){
			ver = u.match(/iCab[ \/]([\d.]+)/)[1];
		}else if(info.chrome){
			ver = u.match(/(?:Chrome|CriOS)[ \/]([\d.]+)/)[1];
		}
		
		info.version = parseFloat(ver);
		info.nativeVersion = parseFloat(nativeVersion);
		
		if(isNaN(info.version)){
			info.version = -1;
		}
	}catch(e){
		info.version = -1;
	}
	
	this.navigator = function(){
		return info;
	};
	
	return info;
};
//-!nv.$Agent.prototype.navigator end!-//

//-!nv.$Agent.prototype.os start!-//
/**
	os() ë©”ì„œë“œëŠ” ì‚¬ìš©ìž ìš´ì˜ì²´ì œ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method os
	@return {Object} ìš´ì˜ì²´ì œ ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´.
	@remark
		<ul class="disc">
			<li>1.4.3 ë²„ì „ë¶€í„° iphone, android, nokia, webos, blackberry, mwin ì‚¬ìš© ê°€ëŠ¥.</li>
			<li>1.4.5 ë²„ì „ë¶€í„° ipad ì‚¬ìš© ê°€ëŠ¥.</li>
			<li>2.3.0 ë²„ì „ë¶€í„° ios, symbianos, version, win8 ì‚¬ìš© ê°€ëŠ¥</li>
		</ul><br>
		ìš´ì˜ì²´ì œ ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´ëŠ” ìš´ì˜ì²´ì œ ì´ë¦„ì„ ì†ì„±ìœ¼ë¡œ ê°€ì§„ë‹¤. ìš´ì˜ ì²´ì œ ì†ì„±ì€ ì˜ì–´ ì†Œë¬¸ìžë¡œ í‘œì‹œí•˜ë©°, ì‚¬ìš©ìžì˜ ìš´ì˜ì²´ì œì™€ ì¼ì¹˜í•˜ëŠ” ìš´ì˜ì²´ì œì˜ ì†ì„±ì€ true ê°’ì„ ê°€ì§„ë‹¤.<br>
		ë˜í•œ ì‚¬ìš©ìžì˜ ìš´ì˜ì²´ì œ ì´ë¦„ì„ í™•ì¸í•  ìˆ˜ ìžˆë„ë¡ ë©”ì„œë“œë¥¼ ì œê³µí•œë‹¤. ë‹¤ìŒì€ ì‚¬ìš©ìž ìš´ì˜ì²´ì œ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ì˜ ì†ì„±ê³¼ ë©”ì„œë“œë¥¼ ì„¤ëª…í•œ í‘œì´ë‹¤.<br>
		<h5>ìš´ì˜ì²´ì œ ì •ë³´ ê°ì²´ ì†ì„±</h5>
		<table class="tbl_board">
			<caption class="hide">ìš´ì˜ì²´ì œ ì •ë³´ ê°ì²´ ì†ì„±</caption>
			<thead>
				<tr>
					<th scope="col" style="width:15%">ì´ë¦„</th>
					<th scope="col" style="width:15%">íƒ€ìž…</th>
					<th scope="col">ì„¤ëª…</th>
					<th scope="col" style="width:25%">ê¸°íƒ€</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">android</td>
					<td>Boolean</td>
					<td class="txt">Android ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">1.4.3 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥</td>
				</tr>
				<tr>
					<td class="txt bold">blackberry</td>
					<td>Boolean</td>
					<td class="txt">Blackberry ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤. </td>
					<td class="txt">1.4.3 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥</td>
				</tr>
				<tr>
					<td class="txt bold">ios</td>
					<td>Boolean</td>
					<td class="txt">iOS ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">2.3.0 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥</td>
				</tr>
				<tr>
					<td class="txt bold">ipad</td>
					<td>Boolean</td>
					<td class="txt">iPad ìž¥ì¹˜ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">1.4.5 ë²„ì „ë¶€í„° ì‚¬ìš©ê°€ëŠ¥/íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">iphone</td>
					<td>Boolean</td>
					<td class="txt">iPhone ìž¥ì¹˜ì¸ì§€ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">1.4.3 ë²„ì „ë¶€í„° ì‚¬ìš©ê°€ëŠ¥/íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">linux</td>
					<td>Boolean</td>
					<td class="txt">Linuxìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt"></td>
				</tr>
				<tr>
					<td class="txt bold">mac</td>
					<td>Boolean</td>
					<td class="txt">Macìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt"></td>
				</tr>
				<tr>
					<td class="txt bold">mwin</td>
					<td>Boolean</td>
					<td class="txt">Window Mobile ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">1.4.3 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥</td>
				</tr>
				<tr>
					<td class="txt bold">nokia</td>
					<td>Boolean</td>
					<td class="txt">Nokia ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">1.4.3 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥ / íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">symbianos</td>
					<td>Boolean</td>
					<td class="txt">SymbianOS ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">2.3.0 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥</td>
				</tr>
				<tr>
					<td class="txt bold">vista</td>
					<td>Boolean</td>
					<td class="txt">Windows Vista ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">webos</td>
					<td>Boolean</td>
					<td>webOS ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td>1.4.3 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥</td>
				</tr>
				<tr>
					<td class="txt bold">win</td>
					<td>Boolean</td>
					<td class="txt">Windowsê³„ì—´ ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt"></td>
				</tr>
				<tr>
					<td class="txt bold">win2000</td>
					<td>Boolean</td>
					<td class="txt">Windows 2000ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">win7</td>
					<td>Boolean</td>
					<td class="txt">Windows 7 ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">win8</td>
					<td>Boolean</td>
					<td class="txt">Windows 8 ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">2.3.0 ë¶€í„° ì‚¬ìš© ê°€ëŠ¥/íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">winxp</td>
					<td>Boolean</td>
					<td class="txt">Windows XP ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">xpsp2</td>
					<td>Boolean</td>
					<td class="txt">Windows XP SP 2 ìš´ì˜ì²´ì œ ì‚¬ìš© ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
					<td class="txt">íì§€ ì˜ˆì •</td>
				</tr>
				<tr>
					<td class="txt bold">version</td>
					<td>String</td>
					<td class="txt">ìš´ì˜ì²´ì œì˜ ë²„ì „ ë¬¸ìžì—´. ë²„ì „ì„ ì°¾ì§€ ëª»í•œ ê²½ìš° nullì´ ì§€ì •ëœë‹¤.</td>
					<td class="txt">2.3.0 ë²„ì „ë¶€í„° ì‚¬ìš© ê°€ëŠ¥</td>
				</tr>
			</tbody>
		</table>
		<h5>ìš´ì˜ì²´ì œ ì •ë³´ ê°ì²´ ë©”ì„œë“œ</h5>
		<table class="tbl_board">
			<caption class="hide">ìš´ì˜ì²´ì œ ì •ë³´ ê°ì²´ ë©”ì„œë“œ</caption>
			<thead>
				<tr>
					<th scope="col" style="width:15%">ì´ë¦„</th>
					<th scope="col" style="width:15%">ë°˜í™˜ íƒ€ìž…</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">getName()</td>
					<td>String</td>
					<td class="txt">ì‚¬ìš©ìžê°€ ì‚¬ìš©í•˜ê³  ìžˆëŠ” ìš´ì˜ì²´ì œì˜ ì´ë¦„ì„ ë°˜í™˜í•œë‹¤. ë°˜í™˜í•˜ëŠ” ìš´ì˜ì²´ì œì˜ ì´ë¦„ì€ ì†ì„± ì´ë¦„ê³¼ ë™ì¼í•˜ë‹¤.</td>
				</tr>
			</tbody>
		</table>
		<h5>ìš´ì˜ì²´ì œë³„ ë²„ì „ ì •ë³´</h5>
		<table class="tbl_board">
			<caption class="hide">ìš´ì˜ì²´ì œë³„ ë²„ì „ ì •ë³´</caption>
			<thead>
				<tr>
					<th scope="col" style="width:60%">ìš´ì˜ì²´ì œ ì´ë¦„</th>
					<th scope="col">ë²„ì „ ê°’</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">Windows 2000</td>
					<td>5.0</td>
				</tr>
				<tr>
					<td class="txt bold">Windows XP</td>
					<td>5.1</td>
				</tr>
				<tr>
					<td class="txt bold">Windows VISTA</td>
					<td>6.0</td>
				</tr>
				<tr>
					<td class="txt bold">Windows 7</td>
					<td>6.1</td>
				</tr>
				<tr>
					<td class="txt bold">Windows 8</td>
					<td>6.2</td>
				</tr>
				<tr>
					<td class="txt bold">Windows 8.1</td>
					<td>6.3</td>
				</tr>
				<tr>
					<td class="txt bold">OS X Tiger</td>
					<td>10.4</td>
				</tr>
				<tr>
					<td class="txt bold">OS X Leopard</td>
					<td>10.5</td>
				</tr>
				<tr>
					<td class="txt bold">OS X Snow Leopard</td>
					<td>10.6</td>
				</tr>
				<tr>
					<td class="txt bold">OS X Lion</td>
					<td>10.7</td>
				</tr>
				<tr>
					<td class="txt bold">OS X Mountain Lion</td>
					<td>10.8</td>
				</tr>
			</tbody>
		</table>
	@example
		var oOS = $Agent().os();  // ì‚¬ìš©ìžì˜ ìš´ì˜ì²´ì œê°€ Windows XPë¼ê³  ê°€ì •í•œë‹¤.
		oOS.linux  // false
		oOS.mac  // false
		oOS.vista  // false
		oOS.win  // true
		oOS.win2000  // false
		oOS.winxp  // true
		oOS.xpsp2  // false
		oOS.win7  // false
		oOS.getName() // winxp
	@example
		var oOS = $Agent().os();  // ë‹¨ë§ê¸°ê°€ iPadì´ê³  ë²„ì „ì´ 5.0 ì´ë¼ê³  ê°€ì •í•œë‹¤.
		info.ipad; // true
		info.ios; // true
		info.version; // "5.0"
		
		info.win; // false
		info.mac; // false
		info.linux; // false
		info.win2000; // false
		info.winxp; // false
		info.xpsp2; // false
		info.vista; // false
		info.win7; // false
		info.win8; // false
		info.iphone; // false
		info.android; // false
		info.nokia; // false
		info.webos; // false
		info.blackberry; // false
		info.mwin; // false
		info.symbianos; // false
 */
nv.$Agent.prototype.os = function() {
	//-@@$Agent.os-@@//
	var info = {},
		u = this._navigator.userAgent,
		p = this._navigator.platform,
		f = function(s, h) {
			return (h.indexOf(s) > -1);
		},
		aMatchResult = null;
	
	info.getName = function(){
		var name = "";
		
		for(var x in info){
			if(info[x] === true && info.hasOwnProperty(x)){
				name = x;
			}
		}
		
		return name;
	};

	info.win = f("Win", p);
	info.mac = f("Mac", p);
	info.linux = f("Linux", p);
	info.win2000 = info.win && (f("NT 5.0", u) || f("Windows 2000", u));
	info.winxp = info.win && f("NT 5.1", u);
	info.xpsp2 = info.winxp && f("SV1", u);
	info.vista = info.win && f("NT 6.0", u);
	info.win7 = info.win && f("NT 6.1", u);
	info.win8 = info.win && f("NT 6.2", u);
	info.ipad = f("iPad", u);
	info.iphone = f("iPhone", u) && !info.ipad;
	info.android = f("Android", u);
	info.nokia =  f("Nokia", u);
	info.webos = f("webOS", u);
	info.blackberry = f("BlackBerry", u);
	info.mwin = f("PPC", u) || f("Smartphone", u) || f("IEMobile", u) || f("Windows Phone", u);
	info.ios = info.ipad || info.iphone;
	info.symbianos = f("SymbianOS", u);
	info.version = null;
	
	if(info.win){
		aMatchResult = u.match(/Windows NT ([\d|\.]+)/);
		if(aMatchResult != null && aMatchResult[1] != undefined){
			info.version = aMatchResult[1];
		}
	}else if(info.mac){
		aMatchResult = u.match(/Mac OS X ([\d|_]+)/);
		if(aMatchResult != null && aMatchResult[1] != undefined){
			info.version = String(aMatchResult[1]).split("_").join(".");
		}

	}else if(info.android){
		aMatchResult = u.match(/Android ([\d|\.]+)/);
		if(aMatchResult != null && aMatchResult[1] != undefined){
			info.version = aMatchResult[1];
		}
	}else if(info.ios){
		aMatchResult = u.match(/(iPhone )?OS ([\d|_]+)/);
		if(aMatchResult != null && aMatchResult[2] != undefined){
			info.version = String(aMatchResult[2]).split("_").join(".");
		}
	}else if(info.blackberry){
		aMatchResult = u.match(/Version\/([\d|\.]+)/); // 6 or 7
		if(aMatchResult == null){
			aMatchResult = u.match(/BlackBerry\s?\d{4}\/([\d|\.]+)/); // 4.2 to 5.0
		}
		if(aMatchResult != null && aMatchResult[1] != undefined){
			info.version = aMatchResult[1];
		}
	}else if(info.symbianos){
		aMatchResult = u.match(/SymbianOS\/(\d+.\w+)/); // exist 7.0s
		if(aMatchResult != null && aMatchResult[1] != undefined){
			info.version = aMatchResult[1];
		}
	}else if(info.webos){
		aMatchResult = u.match(/webOS\/([\d|\.]+)/);
		if(aMatchResult != null && aMatchResult[1] != undefined){
			info.version = aMatchResult[1];
		}
	}else if(info.mwin){
		aMatchResult = u.match(/Windows CE ([\d|\.]+)/);
		if(aMatchResult != null && aMatchResult[1] != undefined){
			info.version = aMatchResult[1];
		}
		if(!info.version && (aMatchResult = u.match(/Windows Phone (OS )?([\d|\.]+)/))){
			info.version = aMatchResult[2];
		}
	}
	
	this.os = function() {
		return info;
	};

	return info;
};
//-!nv.$Agent.prototype.os end!-//

//-!nv.$Agent.prototype.flash start!-//
/**
	flash() ë©”ì„œë“œëŠ” ì‚¬ìš©ìžì˜ Flash Player ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method flash
	@return {Object} Flash Player ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´.
	@filter desktop
	@remark Flash Player ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´ëŠ” Flash Player ì„¤ì¹˜ ì—¬ë¶€ì™€ ì„¤ì¹˜ëœ Flash Playerì˜ ë²„ì „ ì •ë³´ë¥¼ ì œê³µí•œë‹¤. 	ë‹¤ìŒì€ Flash Playerì˜ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ì˜ ì†ì„±ì„ ì„¤ëª…í•œ í‘œì´ë‹¤.<br>
		<h5>Flash Player ì •ë³´ ê°ì²´ ì†ì„±</h5>
		<table class="tbl_board">
			<caption class="hide">Flash Player ì •ë³´ ê°ì²´ ì†ì„±</caption>
			<thead>
				<tr>
					<th scope="col" style="width:15%">ì´ë¦„</th>
					<th scope="col" style="width:15%">íƒ€ìž…</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">installed</td>
					<td>Boolean</td>
					<td class="txt">Flash Player ì„¤ì¹˜ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">version</td>
					<td>Number</td>
					<td class="txt">ì‚¬ìš©ìžê°€ ì‚¬ìš©í•˜ê³  ìžˆëŠ” Flash Playerì˜ ë²„ì „ ì •ë³´ë¥¼ ì €ìž¥í•œë‹¤. ì‹¤ìˆ˜(Float) í˜•íƒœë¡œ ë²„ì „ ì •ë³´ë¥¼ ì €ìž¥í•˜ë©°, Flash Playerê°€ ì„¤ì¹˜ë˜ì§€ ì•Šì€ ê²½ìš° -1ì„ ì €ìž¥í•œë‹¤. </td>
				</tr>
			</tbody>
		</table>
	@see http://www.adobe.com/products/flashplayer/ Flash Player ê³µì‹ íŽ˜ì´ì§€
	@example
		var oFlash = $Agent().flash();
		oFlash.installed  // í”Œëž˜ì‹œ í”Œë ˆì´ì–´ë¥¼ ì„¤ì¹˜í–ˆë‹¤ë©´ true
		oFlash.version  // í”Œëž˜ì‹œ í”Œë ˆì´ì–´ì˜ ë²„ì „.
 */
nv.$Agent.prototype.flash = function() {
	//-@@$Agent.flash-@@//
	var info = {};
	var p    = this._navigator.plugins;
	var m    = this._navigator.mimeTypes;
	var f    = null;

	info.installed = false;
	info.version   = -1;
	
	if (!nv.$Jindo.isUndefined(p)&& p.length) {
		f = p["Shockwave Flash"];
		if (f) {
			info.installed = true;
			if (f.description) {
				info.version = parseFloat(f.description.match(/[0-9.]+/)[0]);
			}
		}

		if (p["Shockwave Flash 2.0"]) {
			info.installed = true;
			info.version   = 2;
		}
	} else if (!nv.$Jindo.isUndefined(m) && m.length) {
		f = m["application/x-shockwave-flash"];
		info.installed = (f && f.enabledPlugin);
	} else {
		try {
			info.version   = parseFloat(new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').match(/(.\d?),/)[1]);
			info.installed = true;
		} catch(e) {}
	}

	this.flash = function() {
		return info;
	};
    /*
    í•˜ìœ„í˜¸í™˜ì„ ìœ„í•´ ì¼ë‹¨ ë‚¨ê²¨ë‘”ë‹¤.
     */
	this.info = this.flash;

	return info;
};
//-!nv.$Agent.prototype.flash end!-//

//-!nv.$Agent.prototype.silverlight start!-//
/**
	silverlight() ë©”ì„œë“œëŠ” ì‚¬ìš©ìžì˜ ì‹¤ë²„ë¼ì´íŠ¸(Silverlight) ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method silverlight
	@return {Object} ì‹¤ë²„ë¼ì´íŠ¸ ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´.
	@filter desktop
	@remark ì‹¤ë²„ë¼ì´íŠ¸ ì •ë³´ë¥¼ ì €ìž¥í•˜ëŠ” ê°ì²´ëŠ” ì‹¤ë²„ë¼ì´íŠ¸ ì„¤ì¹˜ ì—¬ë¶€ì™€ ì„¤ì¹˜ëœ ì‹¤ë²„ë¼ì´íŠ¸ì˜ ë²„ì „ ì •ë³´ë¥¼ ì œê³µí•œë‹¤. ë‹¤ìŒì€ ì‹¤ë²„ë¼ì´íŠ¸ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ì˜ ì†ì„±ì„ ì„¤ëª…í•œ í‘œì´ë‹¤.<br>
		<h5>ì‹¤ë²„ë¼ì´íŠ¸ ì •ë³´ ê°ì²´ ì†ì„±</h5>
		<table class="tbl_board">
			<caption class="hide">ì‹¤ë²„ë¼ì´íŠ¸ ì •ë³´ ê°ì²´ ì†ì„±</caption>
			<thead>
				<tr>
					<th scope="col" style="width:15%">ì´ë¦„</th>
					<th scope="col" style="width:15%">íƒ€ìž…</th>
					<th scope="col">ì„¤ëª…</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">installed</td>
					<td>Boolean</td>
					<td class="txt">ì‹¤ë²„ë¼ì´íŠ¸ ì„¤ì¹˜ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.</td>
				</tr>
				<tr>
					<td class="txt bold">version</td>
					<td>Number</td>
					<td class="txt">ì‚¬ìš©ìžê°€ ì‚¬ìš©í•˜ê³  ìžˆëŠ” ì‹¤ë²„ë¼ì´íŠ¸ì˜ ë²„ì „ ì •ë³´ë¥¼ ì €ìž¥í•œë‹¤. ì‹¤ìˆ˜(Float) í˜•íƒœë¡œ ë²„ì „ ì •ë³´ë¥¼ ì €ìž¥í•˜ë©°, ì‹¤ë²„ë¼ì´íŠ¸ê°€ ì„¤ì¹˜ë˜ì§€ ì•Šì€ ê²½ìš° -1ì„ ì €ìž¥í•œë‹¤. </td>
				</tr>
			</tbody>
		</table>
	@see http://www.microsoft.com/silverlight ì‹¤ë²„ë¼ì´íŠ¸ ê³µì‹ íŽ˜ì´ì§€
	@example
		var oSilver = $Agent.silverlight();
		oSilver.installed  // Silverlight í”Œë ˆì´ì–´ë¥¼ ì„¤ì¹˜í–ˆë‹¤ë©´ true
		oSilver.version  // Silverlight í”Œë ˆì´ì–´ì˜ ë²„ì „.
 */
nv.$Agent.prototype.silverlight = function() {
	//-@@$Agent.silverlight-@@//
	var info = new Object;
	var p    = this._navigator.plugins;
	var s    = null;

	info.installed = false;
	info.version   = -1;

	if (!nv.$Jindo.isUndefined(p) && p.length) {
		s = p["Silverlight Plug-In"];
		if (s) {
			info.installed = true;
			info.version = parseInt(s.description.split(".")[0],10);
			if (s.description == "1.0.30226.2") info.version = 2;
		}
	} else {
		try {
			s = new ActiveXObject("AgControl.AgControl");
			info.installed = true;
			if(s.isVersionSupported("3.0")){
				info.version = 3;
			}else if (s.isVersionSupported("2.0")) {
				info.version = 2;
			} else if (s.isVersionSupported("1.0")) {
				info.version = 1;
			}
		} catch(e) {}
	}

	this.silverlight = function() {
		return info;
	};

	return info;
};
//-!nv.$Agent.prototype.silverlight end!-//

/**
 	@fileOverview nv.$H() ê°ì²´ì˜ ìƒì„±ìž ë° ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name hash.js
	@author NAVER Ajax Platform
 */
//-!nv.$H start!-//
/**
 	nv.$H() ê°ì²´ëŠ” í‚¤(key)ì™€ ê°’(value)ì„ ì›ì†Œë¡œ ê°€ì§€ëŠ” ì—´ê±°í˜• ë°°ì—´ì¸ í•´ì‹œ(Hash)ë¥¼ êµ¬í˜„í•˜ê³ , í•´ì‹œë¥¼ ë‹¤ë£¨ê¸° ìœ„í•œ ì—¬ëŸ¬ ê°€ì§€ ìœ„í•œ ë©”ì„œë“œë¥¼ ì œê³µí•œë‹¤.
	
	@class nv.$H
	@keyword hash, í•´ì‹œ
 */
/**
 	nv.$H() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.
	
	@constructor
	@param {Hash+} oHashObject í•´ì‹œë¡œ ë§Œë“¤ ê°ì²´.
	@example
		var h = $H({one:"first", two:"second", three:"third"});
 */
nv.$H = function(hashObject) {
	//-@@$H-@@//
	var cl = arguments.callee;
	if (hashObject instanceof cl) return hashObject;
	
	if (!(this instanceof cl)){
		try {
			nv.$Jindo._maxWarn(arguments.length, 1,"$H");
			return new cl(hashObject||{});
		} catch(e) {
			if (e instanceof TypeError) { return null; }
			throw e;
		}
	}
	
	var oArgs = g_checkVarType(arguments, {
		'4obj' : ['oObj:Hash+'],
		'4vod' : []
	},"$H");

	this._table = {};
	for(var k in hashObject) {
		if(hashObject.hasOwnProperty(k)){
			this._table[k] = hashObject[k];	
		}
	}
};
//-!nv.$H end!-//

//-!nv.$H.prototype.$value start!-//
/**
 	$value() ë©”ì„œë“œëŠ” í•´ì‹œ(Hash)ë¥¼ ê°ì²´ë¡œ ë°˜í™˜í•œë‹¤.
	
	@method $value
	@return {Object} í•´ì‹œê°€ ì €ìž¥ëœ ê°ì²´.
 */
nv.$H.prototype.$value = function() {
	//-@@$H.$value-@@//
	return this._table;
};
//-!nv.$H.prototype.$value end!-//

//-!nv.$H.prototype.$ start!-//
/**
 	$() ë©”ì„œë“œëŠ” í‚¤(key)ì— í•´ë‹¹í•˜ëŠ” ê°’(value)ì„ ë°˜í™˜í•œë‹¤.
	
	@method $
	@param {String+|Numeric} sKey í•´ì‹œì˜ í‚¤.
	@return {Variant} í‚¤ì— í•´ë‹¹í•˜ëŠ” ê°’.
	@example
		var woH = $H({one:"first", two:"second", three:"third"});
		
		// ê°’ì„ ë°˜í™˜í•  ë•Œ
		var three = woH.$("three");
		// ê²°ê³¼ : three = "third"
 */
/**
 	$() ë©”ì„œë“œëŠ” í‚¤(key)ì™€ ê°’(value)ì„ ì§€ì •í•œ ê°’ìœ¼ë¡œ ì„¤ì •í•œë‹¤.
	
	@method $
	@syntax sKey, vValue
	@syntax oKeyAndValue
	@param {String+ | Numeric} sKey í•´ì‹œì˜ í‚¤.
	@param {Variant} vValue ì„¤ì •í•  ê°’.
	@param {Hash+} oKeyAndValue keyì™€ valueë¡œëœ ì˜¤ë¸Œì íŠ¸
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		var woH = $H({one:"first", two:"second"});
		
		// ê°’ì„ ì„¤ì •í•  ë•Œ
		woH.$("three", "third");
		// ê²°ê³¼ : woH => {one:"first", two:"second", three:"third"}
 */
nv.$H.prototype.$ = function(key, value) {
	//-@@$H.$-@@//
	var oArgs = g_checkVarType(arguments, {
		's4var' : [ nv.$Jindo._F('key:String+'), 'value:Variant' ],
		's4var2' : [ 'key:Numeric', 'value:Variant' ],
		'g4str' : [ 'key:String+' ],
		's4obj' : [ 'oObj:Hash+'],
		'g4num' : [ 'key:Numeric' ]
	},"$H#$");
	
	switch(oArgs+""){
		case "s4var":
		case "s4var2":
			this._table[key] = value;
			return this;
		case "s4obj":
			var obj = oArgs.oObj;
			for(var i in obj){
			    if(obj.hasOwnProperty(i)){
    				this._table[i] = obj[i];
			    }
			}
			return this;
		default:
			return this._table[key];
	}
	
};
//-!nv.$H.prototype.$ end!-//

//-!nv.$H.prototype.length start!-//
/**
 	length() ë©”ì„œë“œëŠ” í•´ì‹œ ê°ì²´ì˜ í¬ê¸°ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method length
	@return {Numeric} í•´ì‹œì˜ í¬ê¸°.
	@example
		var woH = $H({one:"first", two:"second"});
		woH.length(); // ê²°ê³¼ : 2
 */
nv.$H.prototype.length = function() {
	//-@@$H.length-@@//
	var index = 0;
	var sortedIndex = this["__nv_sorted_index"];
	if(sortedIndex){
	    return sortedIndex.length;
	}else{
    	for(var k in this._table) {
    		if(this._table.hasOwnProperty(k)){
    			if (Object.prototype[k] !== undefined && Object.prototype[k] === this._table[k]) continue;
    			index++;
    		}
    	}
    
	}
	return index;
};
//-!nv.$H.prototype.length end!-//

//-!nv.$H.prototype.forEach start(nv.$H.Break,nv.$H.Continue)!-//
/**
 	forEach() ë©”ì„œë“œëŠ” í•´ì‹œì˜ ëª¨ë“  ì›ì†Œë¥¼ ìˆœíšŒí•˜ë©´ì„œ ì½œë°± í•¨ìˆ˜ë¥¼ ì‹¤í–‰í•œë‹¤. ì´ë•Œ í•´ì‹œ ê°ì²´ì˜ í‚¤ì™€ ê°’ ê·¸ë¦¬ê³  ì›ë³¸ í•´ì‹œ ê°ì²´ê°€ ì½œë°± í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥ëœë‹¤. nv.$A() ê°ì²´ì˜ forEach() ë©”ì„œë“œì™€ ìœ ì‚¬í•˜ë‹¤. $H.Break()ì™€ $H.Continue()ì„ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	
	@method forEach
	@param {Function+} fCallback í•´ì‹œë¥¼ ìˆœíšŒí•˜ë©´ì„œ ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜. ì½œë°± í•¨ìˆ˜ëŠ” íŒŒë¼ë¯¸í„°ë¡œ key, value, objectë¥¼ ê°–ëŠ”ë‹¤.<br>
		<ul class="disc">
			<li>valueëŠ” í•´ë‹¹ ì›ì†Œì˜ ê°’ì´ë‹¤.</li>
			<li>keyëŠ” í•´ë‹¹ ì›ì†Œì˜ í‚¤ì´ë‹¤.</li>
			<li>objectëŠ” í•´ì‹œ ê·¸ ìžì²´ë¥¼ ê°€ë¦¬í‚¨ë‹¤.</li>
		</ul>
	@param {Variant} [oThis] ì½œë°± í•¨ìˆ˜ê°€ ê°ì²´ì˜ ë©”ì„œë“œì¼ ë•Œ ì½œë°± í•¨ìˆ˜ ë‚´ë¶€ì—ì„œ this í‚¤ì›Œë“œì˜ ì‹¤í–‰ ë¬¸ë§¥(Execution Context)ìœ¼ë¡œ ì‚¬ìš©í•  ê°ì²´.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$H#map
	@see nv.$H#filter
	@see nv.$A#forEach
	@example
		function printIt(value, key, object) {
		   document.write(key+" => "+value+" <br>");
		}
		$H({one:"first", two:"second", three:"third"}).forEach(printIt);
 */
nv.$H.prototype.forEach = function(callback, scopeObject) {
	//-@@$H.forEach-@@//
	var oArgs = g_checkVarType(arguments, {
		'4fun' : [ 'callback:Function+'],
		'4obj' : [ 'callback:Function+', "thisObject:Variant"]
	},"$H#forEach");
	var t = this._table;
	var h = this.constructor;
	var sortedIndex = this["__nv_sorted_index"];
	
	if(sortedIndex){
	    for(var i = 0, l = sortedIndex.length; i < l ; i++){
	        
	        try {
	            var k = sortedIndex[i];
                callback.call(scopeObject||this, t[k], k, t);
            } catch(e) {
                if (e instanceof h.Break) break;
                if (e instanceof h.Continue) continue;
                throw e;
            }
	    }
	}else{
    	for(var k in t) {
    		if (t.hasOwnProperty(k)) {
    			if (!t.propertyIsEnumerable(k)){
    			    continue;
    			}
    			try {
                    callback.call(scopeObject||this, t[k], k, t);
                } catch(e) {
                    if (e instanceof h.Break) break;
                    if (e instanceof h.Continue) continue;
                    throw e;
                }
    		}
    	}
	}
	
	return this;
};
//-!nv.$H.prototype.forEach end!-//

//-!nv.$H.prototype.filter start(nv.$H.prototype.forEach)!-//
/**
 	filter() ë©”ì„œë“œëŠ” í•´ì‹œì˜ ëª¨ë“  ì›ì†Œë¥¼ ìˆœíšŒí•˜ë©´ì„œ ì½œë°± í•¨ìˆ˜ë¥¼ ì‹¤í–‰í•˜ê³  ì½œë°± í•¨ìˆ˜ê°€ true ê°’ì„ ë°˜í™˜í•˜ëŠ” ì›ì†Œë§Œ ëª¨ì•„ ìƒˆë¡œìš´ nv.$H() ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤. nv.$A() ê°ì²´ì˜ filter() ë©”ì„œë“œì™€ ìœ ì‚¬í•˜ë‹¤. $H.Break()ì™€ $H.Continue()ì„ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	
	@method filter
	@param {Function+} fCallback í•´ì‹œë¥¼ ìˆœíšŒí•˜ë©´ì„œ ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜. ì½œë°± í•¨ìˆ˜ëŠ” Boolean í˜•íƒœë¡œ ê°’ì„ ë°˜í™˜í•´ì•¼ í•œë‹¤. true ê°’ì„ ë°˜í™˜í•˜ëŠ” ì›ì†ŒëŠ” ìƒˆë¡œìš´ í•´ì‹œì˜ ì›ì†Œê°€ ëœë‹¤. ì½œë°± í•¨ìˆ˜ëŠ” íŒŒë¼ë¯¸í„°ë¡œ value, key, objectë¥¼ ê°–ëŠ”ë‹¤.<br>
		<ul class="disc">
			<li>valueëŠ” í•´ë‹¹ ì›ì†Œì˜ ê°’ì´ë‹¤.</li>
			<li>keyëŠ” í•´ë‹¹ ì›ì†Œì˜ í‚¤ì´ë‹¤.</li>
			<li>objectëŠ” í•´ì‹œ ê·¸ ìžì²´ë¥¼ ê°€ë¦¬í‚¨ë‹¤.</li>
		</ul>
	@param {Variant} [oThis] ì½œë°± í•¨ìˆ˜ê°€ ê°ì²´ì˜ ë©”ì„œë“œì¼ ë•Œ ì½œë°± í•¨ìˆ˜ ë‚´ë¶€ì—ì„œ this í‚¤ì›Œë“œì˜ ì‹¤í–‰ ë¬¸ë§¥(Execution Context) ì‚¬ìš©í•  ê°ì²´.
	@return {nv.$H} ì½œë°± í•¨ìˆ˜ì˜ ë°˜í™˜ ê°’ì´ trueì¸ ì›ì†Œë¡œ ì´ë£¨ì–´ì§„ ìƒˆë¡œìš´ nv.$H() ê°ì²´.
	@see nv.$H#forEach
	@see nv.$H#map
	@see nv.$A#filter
	@example
		var ht=$H({one:"first", two:"second", three:"third"})
		
		ht.filter(function(value, key, object){
			return value.length < 5;
		})
		
		// ê²°ê³¼
		// one:"first", three:"third"
 */
nv.$H.prototype.filter = function(callback, thisObject) {
	//-@@$H.filter-@@//
	var oArgs = g_checkVarType(arguments, {
		'4fun' : [ 'callback:Function+'],
		'4obj' : [ 'callback:Function+', "thisObject:Variant"]
	},"$H#filter");
	var h = nv.$H();
	var t = this._table;
	var hCon = this.constructor;
	
	for(var k in t) {
		if (t.hasOwnProperty(k)) {
			if (!t.propertyIsEnumerable(k)) continue;
			try {
				if(callback.call(thisObject||this, t[k], k, t)){
					h.add(k,t[k]);
				}
			} catch(e) {
				if (e instanceof hCon.Break) break;
				if (e instanceof hCon.Continue) continue;
				throw e;
			}
		}
	}
	return h;
};
//-!nv.$H.prototype.filter end!-//

//-!nv.$H.prototype.map start(nv.$H.prototype.forEach)!-//
/**
 	map() ë©”ì„œë“œëŠ” í•´ì‹œì˜ ëª¨ë“  ì›ì†Œë¥¼ ìˆœíšŒí•˜ë©´ì„œ ì½œë°± í•¨ìˆ˜ë¥¼ ì‹¤í–‰í•˜ê³  ì½œë°± í•¨ìˆ˜ì˜ ì‹¤í–‰ ê²°ê³¼ë¥¼ ë°°ì—´ì˜ ì›ì†Œì— ì„¤ì •í•œë‹¤. nv.$A() ê°ì²´ì˜ map() ë©”ì„œë“œì™€ ìœ ì‚¬í•˜ë‹¤. $H.Break()ì™€ $H.Continue()ì„ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	
	@method map
	@param {Function+} fCallback í•´ì‹œë¥¼ ìˆœíšŒí•˜ë©´ì„œ ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜. ì½œë°± í•¨ìˆ˜ì—ì„œ ë°˜í™˜í•˜ëŠ” ê°’ì„ í•´ë‹¹ ì›ì†Œì˜ ê°’ìœ¼ë¡œ ìž¬ì„¤ì •í•œë‹¤. ì½œë°± í•¨ìˆ˜ëŠ” íŒŒë¼ë¯¸í„°ë¡œ value, key, objectë¥¼ ê°–ëŠ”ë‹¤.<br>
		<ul class="disc">
			<li>valueëŠ” í•´ë‹¹ ì›ì†Œì˜ ê°’ì´ë‹¤.</li>
			<li>keyëŠ” í•´ë‹¹ ì›ì†Œì˜ í‚¤ì´ë‹¤.</li>
			<li>objectëŠ” í•´ì‹œ ê·¸ ìžì²´ë¥¼ ê°€ë¦¬í‚¨ë‹¤.</li>
		</ul>
	@param {Variant} [oThis] ì½œë°± í•¨ìˆ˜ê°€ ê°ì²´ì˜ ë©”ì„œë“œì¼ ë•Œ ì½œë°± í•¨ìˆ˜ ë‚´ë¶€ì—ì„œ this í‚¤ì›Œë“œì˜ ì‹¤í–‰ ë¬¸ë§¥(Execution Context) ì‚¬ìš©í•  ê°ì²´.
	@return {nv.$H} ì½œë°± í•¨ìˆ˜ì˜ ìˆ˜í–‰ ê²°ê³¼ë¥¼ ë°˜ì˜í•œ ìƒˆë¡œìš´ nv.$H() ê°ì²´.
	@see nv.$H#forEach
	@see nv.$H#filter
	@see nv.$H#map
	@example
		function callback(value, key, object) {
		   var r = key+"_"+value;
		   document.writeln (r + "<br />");
		   return r;
		}
		
		$H({one:"first", two:"second", three:"third"}).map(callback);
 */

nv.$H.prototype.map = function(callback, thisObject) {
	//-@@$H.map-@@//
	var oArgs = g_checkVarType(arguments, {
		'4fun' : [ 'callback:Function+'],
		'4obj' : [ 'callback:Function+', "thisObject:Variant"]
	},"$H#map");
	var h = nv.$H();
	var t = this._table;
	var hCon = this.constructor;
	
	for(var k in t) {
		if (t.hasOwnProperty(k)) {
			if (!t.propertyIsEnumerable(k)) continue;
			try {
				h.add(k,callback.call(thisObject||this, t[k], k, t));
			} catch(e) {
				if (e instanceof hCon.Break) break;
				if (e instanceof hCon.Continue){
					h.add(k,t[k]);
				}else{
					throw e;
				}
			}
		}
	}
	
	return h;
};
//-!nv.$H.prototype.map end!-//

//-!nv.$H.prototype.add start!-//
/**
 	add() ë©”ì„œë“œëŠ” í•´ì‹œì— ê°’ì„ ì¶”ê°€í•œë‹¤. íŒŒë¼ë¯¸í„°ë¡œ ê°’ì„ ì¶”ê°€í•  í‚¤ë¥¼ ì§€ì •í•œë‹¤. ì§€ì •í•œ í‚¤ì— ì´ë¯¸ ê°’ì´ ìžˆë‹¤ë©´ ì§€ì •í•œ ê°’ìœ¼ë¡œ ë³€ê²½í•œë‹¤.
	
	@method add
	@param {String+ | Numeric} sKey ê°’ì„ ì¶”ê°€í•˜ê±°ë‚˜ ë³€ê²½í•  í‚¤.
	@param {Variant} vValue í•´ë‹¹ í‚¤ì— ì¶”ê°€í•  ê°’.
	@return {this} ê°’ì„ ì¶”ê°€í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$H#remove
	@example
		var woH = $H();
		// í‚¤ê°€ 'foo'ì´ê³  ê°’ì´ 'bar'ì¸ ì›ì†Œë¥¼ ì¶”ê°€
		woH.add('foo', 'bar');
		
		// í‚¤ê°€ 'foo'ì¸ ì›ì†Œì˜ ê°’ì„ 'bar2'ë¡œ ë³€ê²½
		woH.add('foo', 'bar2');
 */
nv.$H.prototype.add = function(key, value) {
	//-@@$H.add-@@//
	var oArgs = g_checkVarType(arguments, {
		'4str' : [ 'key:String+',"value:Variant"],
		'4num' : [ 'key:Numeric',"value:Variant"]
	},"$H#add");
	var sortedIndex = this["__nv_sorted_index"];
    if(sortedIndex && this._table[key]==undefined ){
        this["__nv_sorted_index"].push(key);
    }
	this._table[key] = value;

	return this;
};
//-!nv.$H.prototype.add end!-//

//-!nv.$H.prototype.remove start!-//
/**
 	remove() ë©”ì„œë“œëŠ” ì§€ì •í•œ í‚¤ì˜ ì›ì†Œë¥¼ ì œê±°í•œë‹¤. í•´ë‹¹í•˜ëŠ” ì›ì†Œê°€ ì—†ìœ¼ë©´ ì•„ë¬´ ì¼ë„ ìˆ˜í–‰í•˜ì§€ ì•ŠëŠ”ë‹¤.
	
	@method remove
	@param {String+ | Numeric} sKey ì œê±°í•  ì›ì†Œì˜ í‚¤.
	@return {Variant} ì œê±°í•œ ê°’.
	@see nv.$H#add
	@example
		var h = $H({one:"first", two:"second", three:"third"});
		h.remove ("two");
		// hì˜ í•´ì‹œ í…Œì´ë¸”ì€ {one:"first", three:"third"}
 */
nv.$H.prototype.remove = function(key) {
	//-@@$H.remove-@@//
	var oArgs = g_checkVarType(arguments, {
		'4str' : [ 'key:String+'],
		'4num' : [ 'key:Numeric']
	},"$H#remove");
	
	if (this._table[key] === undefined) return null;
	var val = this._table[key];
	delete this._table[key];
	
	
	var sortedIndex = this["__nv_sorted_index"];
	if(sortedIndex){
    	var newSortedIndex = [];
    	for(var i = 0, l = sortedIndex.length ; i < l ; i++){
    	    if(sortedIndex[i] != key){
    	        newSortedIndex.push(sortedIndex[i]);
    	    }
    	}
    	this["__nv_sorted_index"] = newSortedIndex;
	}
	return val;
};
//-!nv.$H.prototype.remove end!-//

//-!nv.$H.prototype.search start!-//
/**
 	search() ë©”ì„œë“œëŠ” í•´ì‹œì—ì„œ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ê°’ì„ ê°€ì§€ëŠ” ì›ì†Œì˜ í‚¤ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method search
	@param {Variant} sValue ê²€ìƒ‰í•  ê°’.
	@return {Variant} í•´ë‹¹ ê°’ì„ ê°€ì§€ê³  ìžˆëŠ” ì›ì†Œì˜ í‚¤(String). ì§€ì •í•œ ê°’ì„ ê°€ì§„ ì›ì†Œê°€ ì—†ë‹¤ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@example
		var h = $H({one:"first", two:"second", three:"third"});
		h.search ("second"); // two
		h.search ("fist"); // false
 */
nv.$H.prototype.search = function(value) {
	//-@@$H.search-@@//
	var oArgs = g_checkVarType(arguments, {
		'4str' : [ 'value:Variant']
	},"$H#search");
	var result = false;
	var t = this._table;

	for(var k in t) {
		if (t.hasOwnProperty(k)) {
			if (!t.propertyIsEnumerable(k)) continue;
			var v = t[k];
			if (v === value) {
				result = k;
				break;
			}			
		}
	}
	
	return result;
};
//-!nv.$H.prototype.search end!-//

//-!nv.$H.prototype.hasKey start!-//
/**
 	hasKey() ë©”ì„œë“œëŠ” í•´ì‹œì— íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥í•œ í‚¤ê°€ ìžˆëŠ”ì§€ í™•ì¸í•œë‹¤.
	
	@method hasKey
	@param {String+|Numeric} sKey ê²€ìƒ‰í•  í‚¤.
	@return {Boolean} í‚¤ì˜ ì¡´ìž¬ ì—¬ë¶€. ì¡´ìž¬í•˜ë©´ true ì—†ìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@example
		var h = $H({one:"first", two:"second", three:"third"});
		h.hasKey("four"); // false
		h.hasKey("one"); // true
 */
nv.$H.prototype.hasKey = function(key) {
	//-@@$H.hasKey-@@//
	var oArgs = g_checkVarType(arguments, {
		'4str' : [ 'key:String+'],
		'4num' : [ 'key:Numeric']
	},"$H#hasKey");
	return this._table[key] !== undefined;
};
//-!nv.$H.prototype.hasKey end!-//

//-!nv.$H.prototype.hasValue start(nv.$H.prototype.search)!-//
/**
 	hasValue() ë©”ì„œë“œëŠ” í•´ì‹œì— íŒŒë¼ë¯¸í„°ë¡œë¡œ ìž…ë ¥í•œ ê°’ì´ ìžˆëŠ”ì§€ í™•ì¸í•œë‹¤.
	
	@method hasValue
	@param {Variant} vValue í•´ì‹œì—ì„œ ê²€ìƒ‰í•  ê°’.
	@return {Boolean} ê°’ì˜ ì¡´ìž¬ ì—¬ë¶€. ì¡´ìž¬í•˜ë©´ true ì—†ìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
 */
nv.$H.prototype.hasValue = function(value) {
	//-@@$H.hasValue-@@//
	var oArgs = g_checkVarType(arguments, {
		'4str' : [ 'value:Variant']
	},"$H#hasValue");
	return (this.search(value) !== false);
};
//-!nv.$H.prototype.hasValue end!-//



//-!nv.$H.prototype.sort start(nv.$H.prototype.search)!-//
nv._p_.defaultSort = function(oArgs,that,type){
    var aSorted = [];
    var fpSort = oArgs.fpSort;
    for(var k in that._table) {
        if(that._table.hasOwnProperty(k)){
          (function(k,v){
            aSorted.push({
                "key" : k,
                "val" : v
            });
          })(k,that._table[k]);
        }
    }
    
    if(oArgs+"" === "vo"){
        fpSort = function (a,b){
            return a === b ? 0 : a > b ? 1 : -1;
        };
    }
    
    aSorted.sort(function(beforeVal,afterVal){
        return fpSort.call(that, beforeVal[type], afterVal[type]);
    });
    
    var sortedKey = [];
    for(var i = 0, l = aSorted.length; i < l; i++){
        sortedKey.push(aSorted[i].key);
    }
    
    return sortedKey;
};
/**
 	sort() ë©”ì„œë“œëŠ” ê°’ì„ ê¸°ì¤€ìœ¼ë¡œ í•´ì‹œì˜ ì›ì†Œë¥¼ ì˜¤ë¦„ì°¨ìˆœ ì •ë ¬í•œë‹¤.
	ë‹¤ë§Œ, ì‹¤ì œ ê°’ì´ ë³€ê²½ë˜ëŠ” ê²ƒì´ ì•„ë‹ˆë¼ $H#forEachì„ ì‚¬ìš©í•´ì•¼ì§€ë§Œ
	ì •ë ¬ëœ ê²°ê³¼ë¥¼ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	
	@method sort
	@param {Function} [sortFunc] ì§ì ‘ ì •ë ¬í•  ìˆ˜ ìžˆë„ë¡ í•¨ìˆ˜ë¥¼ ë„£ì„ ìˆ˜ ìžˆë‹¤.
		@param {Variant} [sortFunc.preVal] ì•žì˜ ê°’
		@param {Variant} [sortFunc.foreVal] ë’¤ì˜ ê°’
		
	@return {this} ì›ì†Œë¥¼ ì •ë ¬í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$H#ksort
	@see nv.$H#forEach
	@example
		var h = $H({one:"í•˜ë‚˜", two:"ë‘˜", three:"ì…‹"});
		h.sort ();
		h.forEach(function(v){
			//ë‘˜
			//ì…‹
			//í•˜ë‚˜
		});
	@example
		var h = $H({one:"í•˜ë‚˜", two:"ë‘˜", three:"ì…‹"});
		h.sort(function(val, val2){
			return val === val2 ? 0 : val < val2 ? 1 : -1;
		});
		h.forEach(function(v){
			//í•˜ë‚˜
			//ì…‹
			//ë‘˜
		});
 */

nv.$H.prototype.sort = function(fpSort) {
	//-@@$H.sort-@@//
	var oArgs = g_checkVarType(arguments, {
	    'vo'  : [],
        '4fp' : [ 'fpSort:Function+']
    },"$H#sort");
    
	this["__nv_sorted_index"] = nv._p_.defaultSort(oArgs,this,"val"); 
	return this;
};
//-!nv.$H.prototype.sort end!-//

//-!nv.$H.prototype.ksort start(nv.$H.prototype.keys)!-//
/**
 	ksort() ë©”ì„œë“œëŠ” í‚¤ë¥¼ ê¸°ì¤€ìœ¼ë¡œ í•´ì‹œì˜ ì›ì†Œë¥¼ ì˜¤ë¦„ì°¨ìˆœ ì •ë ¬í•œë‹¤.
	ë‹¤ë§Œ, ì‹¤ì œ ê°’ì´ ë³€ê²½ë˜ëŠ” ê²ƒì´ ì•„ë‹ˆë¼ $H#forEachì„ ì‚¬ìš©í•´ì•¼ì§€ë§Œ
	ì •ë ¬ëœ ê²°ê³¼ë¥¼ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	
	@method ksort
	@param {Function} [sortFunc] ì§ì ‘ ì •ë ¬í•  ìˆ˜ ìžˆë„ë¡ í•¨ìˆ˜ë¥¼ ë„£ì„ ìˆ˜ ìžˆë‹¤.
		@param {Variant} [sortFunc.preKey] ì•žì˜ í‚¤
		@param {Variant} [sortFunc.foreKey] ë’¤ì˜ í‚¤
	@return {this} ì›ì†Œë¥¼ ì •ë ¬í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$H#sort
	@see nv.$H#forEach
	@example
		var h = $H({one:"í•˜ë‚˜", two:"ë‘˜", three:"ì…‹"});
		h.ksort ();
		h.forEach(function(v){
			//í•˜ë‚˜
			//ì…‹
			//ë‘˜
		});
	@example
		var h = $H({one:"í•˜ë‚˜", two:"ë‘˜", three:"ì…‹"});
		h.ksort (function(key, key2){
			return key === key2 ? 0 : key < key2 ? 1 : -1;
		});
		h.forEach(function(v){
			//ë‘˜
			//ì…‹
			//í•˜ë‚˜
		});
 */
nv.$H.prototype.ksort = function(fpSort) {
	//-@@$H.ksort-@@//
	var oArgs = g_checkVarType(arguments, {
        'vo'  : [],
        '4fp' : [ 'fpSort:Function+']
    },"$H#ksort");
    
    this["__nv_sorted_index"] = nv._p_.defaultSort(oArgs,this,"key");
	return this;
};
//-!nv.$H.prototype.ksort end!-//

//-!nv.$H.prototype.keys start!-//
/**
 	keys() ë©”ì„œë“œëŠ” í•´ì‹œì˜ í‚¤ë¥¼ ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤.
	
	@method keys
	@return {Array} í•´ì‹œ í‚¤ì˜ ë°°ì—´.
	@see nv.$H#values
	@example
		var h = $H({one:"first", two:"second", three:"third"});
		h.keys ();
		// ["one", "two", "three"]
 */
nv.$H.prototype.keys = function() {
	//-@@$H.keys-@@//
	var keys = this["__nv_sorted_index"];
	
	if(!keys){
	    keys = [];
    	for(var k in this._table) {
    		if(this._table.hasOwnProperty(k))
    			keys.push(k);
    	}
	}

	return keys;
};
//-!nv.$H.prototype.keys end!-//

//-!nv.$H.prototype.values start!-//
/**
 	values() ë©”ì„œë“œëŠ” í•´ì‹œì˜ ê°’ì„ ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤.
	
	@method values
	@return {Array} í•´ì‹œ ê°’ì˜ ë°°ì—´.
	@example
		var h = $H({one:"first", two:"second", three:"third"});
		h.values();
		// ["first", "second", "third"]
 */
nv.$H.prototype.values = function() {
	//-@@$H.values-@@//
	var values = [];
	for(var k in this._table) {
		if(this._table.hasOwnProperty(k))
			values[values.length] = this._table[k];
	}

	return values;
};
//-!nv.$H.prototype.values end!-//

//-!nv.$H.prototype.toQueryString start!-//
/**
 	toQueryString() ë©”ì„œë“œëŠ” í•´ì‹œë¥¼ ì¿¼ë¦¬ ìŠ¤íŠ¸ë§(Query String) í˜•íƒœë¡œ ë§Œë“ ë‹¤.
	
	@method toQueryString
	@return {String} í•´ì‹œë¥¼ ë³€í™˜í•œ ì¿¼ë¦¬ ìŠ¤íŠ¸ë§.
	@see http://en.wikipedia.org/wiki/Querystring Query String - Wikipedia
	@example
		var h = $H({one:"first", two:"second", three:"third"});
		h.toQueryString();
		// "one=first&two=second&three=third"
 */
nv.$H.prototype.toQueryString = function() {
	//-@@$H.toQueryString-@@//
	var buf = [], val = null, idx = 0;

	for(var k in this._table) {
		if(this._table.hasOwnProperty(k)) {
			val = this._table[k];

			if(nv.$Jindo.isArray(val)) {
				for(var i=0; i < val.length; i++) {
					buf[buf.length] = encodeURIComponent(k)+"[]="+encodeURIComponent(val[i]+"");
				}
			} else {
				buf[buf.length] = encodeURIComponent(k)+"="+encodeURIComponent(this._table[k]+"");
			}
		}
	}
	
	return buf.join("&");
};
//-!nv.$H.prototype.toQueryString end!-//

//-!nv.$H.prototype.empty start!-//
/**
 	empty() ë©”ì„œë“œëŠ” í•´ì‹œë¥¼ ë¹„ìš´ë‹¤.
	
	@method empty
	@return {this} ë¹„ì›Œì§„ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		var hash = $H({a:1, b:2, c:3});
		// hash => {a:1, b:2, c:3}
		
		hash.empty();
		// hash => {}
 */
nv.$H.prototype.empty = function() {
	//-@@$H.empty-@@//
	this._table = {};
	delete this["__nv_sorted_index"];
	
	return this;
};
//-!nv.$H.prototype.empty end!-//

//-!nv.$H.Break start!-//
/**
 	Break() ë©”ì„œë“œëŠ” forEach(), filter(), map() ë©”ì„œë“œì˜ ë£¨í”„ë¥¼ ì¤‘ë‹¨í•œë‹¤. ë‚´ë¶€ì ìœ¼ë¡œëŠ” ê°•ì œë¡œ ì˜ˆì™¸ë¥¼ ë°œìƒì‹œí‚¤ëŠ” êµ¬ì¡°ì´ë¯€ë¡œ, try - catch ì˜ì—­ì—ì„œ ì´ ë©”ì„œë“œë¥¼ ì‹¤í–‰í•˜ë©´ ì •ìƒì ìœ¼ë¡œ ë™ìž‘í•˜ì§€ ì•Šì„ ìˆ˜ ìžˆë‹¤.
	
	@method Break
	@static
	@see nv.$H#Continue
	@see nv.$H#forEach
	@see nv.$H#filter
	@see nv.$H#map
	@example
		$H({a:1, b:2, c:3}).forEach(function(v,k,o) {
		  ...
		  if (k == "b") $H.Break();
		   ...
		});
 */
nv.$H.Break = nv.$Jindo.Break;
//-!nv.$H.Break end!-//

//-!nv.$H.Continue start!-//
/**
 	Continue() ë©”ì„œë“œëŠ” forEach(), filter(), map() ë©”ì„œë“œì˜ ë£¨í”„ì—ì„œ ë‚˜ë¨¸ì§€ ëª…ë ¹ì„ ì‹¤í–‰í•˜ì§€ ì•Šê³  ë‹¤ìŒ ë£¨í”„ë¡œ ê±´ë„ˆë›´ë‹¤. ë‚´ë¶€ì ìœ¼ë¡œëŠ” ê°•ì œë¡œ ì˜ˆì™¸ë¥¼ ë°œìƒì‹œí‚¤ëŠ” êµ¬ì¡°ì´ë¯€ë¡œ, try - catch ì˜ì—­ì—ì„œ ì´ ë©”ì„œë“œë¥¼ ì‹¤í–‰í•˜ë©´ ì •ìƒì ìœ¼ë¡œ ë™ìž‘í•˜ì§€ ì•Šì„ ìˆ˜ ìžˆë‹¤.
	
	@method Continue
	@static
	@see nv.$H#Break
	@see nv.$H#forEach
	@see nv.$H#filter
	@see nv.$H#map
	@example
		$H({a:1, b:2, c:3}).forEach(function(v,k,o) {
		   ...
		   if (v % 2 == 0) $H.Continue();
		   ...
		});
 */
nv.$H.Continue  = nv.$Jindo.Continue;
//-!nv.$H.Continue end!-//


/**
 	@fileOverview nv.$Fn() ê°ì²´ì˜ ï¿½ï¿½ï¿½ì„±ìž ë° ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name function.js 
	@author NAVER Ajax Platform
 */
//-!nv.$Fn start!-//
/**
 	nv.$Fn() ê°ì²´ëŠ” Function ê°ì²´ë¥¼ ëž˜í•‘(wrapping)í•˜ì—¬ í•¨ìˆ˜ì™€ ê´€ë ¨ëœ í™•ìž¥ ê¸°ëŠ¥ì„ ì œê³µí•œë‹¤.
	
	@class nv.$Fn
	@keyword function, í•¨ìˆ˜
 */
/**
 	nv.$Fn() ê°ì²´()ë¥¼ ìƒì„±í•œë‹¤. ìƒì„±ìžì˜ íŒŒë¼ë¯¸í„°ë¡œ íŠ¹ì • í•¨ìˆ˜ë¥¼ ì§€ì •í•  ìˆ˜ ìžˆë‹¤. ì´ ë•Œ, í•¨ìˆ˜ì™€ í•¨ê»˜ this í‚¤ì›Œë“œë¥¼ ìƒí™©ì— ë§žê²Œ ì‚¬ìš©í•  ìˆ˜ ìžˆë„ë¡ ì‹¤í–‰ ë¬¸ë§¥(Execution Context)ì„ í•¨ê»˜ ì§€ì •í•  ìˆ˜ ìžˆë‹¤. ë˜í•œ ìƒì„±ìžì˜ íŒŒë¼ë¯¸í„°ë¡œ ëž˜í•‘í•  í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ì™€ ëª¸ì²´ë¥¼ ê°ê° ìž…ë ¥í•˜ì—¬ nv.$Fn() ê°ì²´ë¥¼ ìƒì„±í•  ìˆ˜ ìžˆë‹¤.
	
	@constructor
	@syntax fpFunction, vExeContext
	@syntax sFuncArgs, sFuncBody
	@param {Function+} fpFunction ëž©í•‘í•  í•¨ìˆ˜
	@param {Variant} [vExeContext] í•¨ìˆ˜ì˜ ì‹¤í–‰ ë¬¸ë§¥ì´ ë  ê°ì²´
	@param {String} sFuncArgs í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¥¼ ë‚˜íƒ€ë‚´ëŠ” ë¬¸ìžì—´
	@param {String} sFuncBody í•¨ìˆ˜ì˜ ëª¸ì²´ë¥¼ ë‚˜íƒ€ë‚´ëŠ” ë¬¸ìžì—´
	@return {nv.$Fn} nv.$Fn() ê°ì²´
	@see nv.$Fn#toFunction
	@example
		func : function() {
		       // code here
		}
		
		var fn = $Fn(func, this);
	@example
		var someObject = {
		    func : function() {
		       // code here
		   }
		}
		
		var fn = $Fn(someObject.func, someObject);
	@example
		var fn = $Fn("a, b", "return a + b;");
		var result = fn.$value()(1, 2) // result = 3;
		
		// fnì€ í•¨ìˆ˜ ë¦¬í„°ëŸ´ì¸ function(a, b){ return a + b;}ì™€ ë™ì¼í•œ í•¨ìˆ˜ë¥¼ ëž˜í•‘í•œë‹¤.
 */
nv.$Fn = function(func, thisObject) {
	//-@@$Fn-@@//
	var cl = arguments.callee;
	if (func instanceof cl) return func;

	if (!(this instanceof cl)){
		try {
			nv.$Jindo._maxWarn(arguments.length, 2,"$Fn");
			return new cl(func, thisObject);
		} catch(e) {
			if (e instanceof TypeError) { return null; }
			throw e;
		}
	}	

	var oArgs = g_checkVarType(arguments, {
		'4fun' : ['func:Function+'],
		'4fun2' : ['func:Function+', "thisObject:Variant"],
		'4str' : ['func:String+', "thisObject:String+"]
	},"$Fn");

	this._tmpElm = null;
	this._key    = null;
	
	switch(oArgs+""){
		case "4str":
			this._func = eval("false||function("+func+"){"+thisObject+"}");
			break;
		case "4fun":
		case "4fun2":
			this._func = func;
			this._this = thisObject;
			
	}

};

/**
 * @ignore 
 */
nv.$Fn._commonPram = function(oPram,sMethod){
	return g_checkVarType(oPram, {
		'4ele' : ['eElement:Element+',"sEvent:String+"],
		'4ele2' : ['eElement:Element+',"sEvent:String+","bUseCapture:Boolean"],
		'4str' : ['eElement:String+',"sEvent:String+"],
		'4str2' : ['eElement:String+',"sEvent:String+","bUseCapture:Boolean"],
		'4arr' : ['aElement:Array+',"sEvent:String+"],
		'4arr2' : ['aElement:Array+',"sEvent:String+","bUseCapture:Boolean"],
		'4doc' : ['eElement:Document+',"sEvent:String+"],
		'4win' : ['eElement:Window+',"sEvent:String+"],
		'4doc2' : ['eElement:Document+',"sEvent:String+","bUseCapture:Boolean"],
		'4win2' : ['eElement:Window+',"sEvent:String+","bUseCapture:Boolean"]
	},sMethod);
};
//-!nv.$Fn end!-//

//-!nv.$Fn.prototype.$value start!-//
/**
 	$value() ë©”ì„œë“œëŠ” ì›ë³¸ Function ê°ì²´ë¥¼ ë°˜í™˜ï¿½ï¿½ï¿½ë‹¤.
	
	@method $value
	@return {Function} ì›ë³¸ Function ê°ì²´
	@example
		func : function() {
			// code here
		}
		
		var fn = $Fn(func, this);
		fn.$value(); // ì›ëž˜ì˜ í•¨ìˆ˜ê°€ ë¦¬í„´ëœë‹¤.
 */
nv.$Fn.prototype.$value = function() {
	//-@@$Fn.$value-@@//
	return this._func;
};
//-!nv.$Fn.prototype.$value end!-//

//-!nv.$Fn.prototype.bind start!-//
/**
 	bind() ë©”ì„œë“œëŠ” ìƒì„±ìžê°€ ì§€ì •í•œ ê°ì²´ì˜ ë©”ì„œë“œë¡œ ë™ìž‘í•˜ë„ë¡ ë¬¶ì€ Function ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤. ì´ë•Œ í•´ë‹¹ ë©”ì„œë“œì˜ ì‹¤í–‰ ë¬¸ë§¥(Execution Context)ì´ ì§€ì •í•œ ê°ì²´ë¡œ ì„¤ì •ëœë‹¤.
	
	@method bind
	@param {Variant} [vParameter*] ìƒì„±í•œ í•¨ìˆ˜ì— ê¸°ë³¸ì ìœ¼ë¡œ ìž…ë ¥í•  ì²«~N ë²ˆì§¸ íŒŒë¼ë¯¸í„°.
	@return {Function} ì‹¤í–‰ ë¬¸ë§¥ì˜ ë©”ì„œë“œë¡œ ë¬¶ì¸ Function ê°ì²´
	@see nv.$Fn
	@see nv.$Class
	@example
		var sName = "OUT";
		var oThis = {
		    sName : "IN"
		};
		
		function getName() {
		    return this.sName;
		}
		
		oThis.getName = $Fn(getName, oThis).bind();
		
		alert( getName() );       	  //  OUT
		alert( oThis.getName() ); //   IN
	@example
		 // ë°”ì¸ë“œí•œ ë©”ì„œë“œì— ì¸ìˆ˜ë¥¼ ìž…ë ¥í•  ê²½ìš°
		var b = $Fn(function(one, two, three){
			console.log(one, two, three);
		}).bind(true);
		
		b();	// true, undefined, undefined
		b(false);	// true, false, undefined
		b(false, "1234");	// true, false, "1234"
	@example
		// í•¨ìˆ˜ë¥¼ ë¯¸ë¦¬ ì„ ì–¸í•˜ê³  ë‚˜ì¤‘ì— ì‚¬ìš©í•  ë•Œ í•¨ìˆ˜ì—ì„œ ì°¸ì¡°í•˜ëŠ” ê°’ì€ í•´ë‹¹ í•¨ìˆ˜ë¥¼ 
		// ìƒì„±í•  ë•Œì˜ ê°’ì´ ì•„ë‹ˆë¼ í•¨ìˆ˜ ì‹¤í–‰ ì‹œì ì˜ ê°’ì´ ì‚¬ìš©ë˜ë¯€ë¡œ ì´ë•Œ bind() ë©”ì„œë“œë¥¼ ì´ìš©í•œë‹¤.
		for(var i=0; i<2;i++){
			aTmp[i] = function(){alert(i);}
		}
		
		for(var n=0; n<2;n++){
			aTmp[n](); // ìˆ«ìž 2ë§Œ ë‘ë²ˆ alertëœë‹¤.
		}
		
		for(var i=0; i<2;i++){
		aTmp[i] = $Fn(function(nTest){alert(nTest);}, this).bind(i);
		}
		
		for(var n=0; n<2;n++){
			aTmp[n](); // ìˆ«ìž 0, 1ì´ alertëœë‹¤.
		}
	@example
		//í´ëž˜ìŠ¤ë¥¼ ìƒì„±í•  ë•Œ í•¨ìˆ˜ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì‚¬ìš©í•˜ë©´, scopeë¥¼ ë§žì¶”ê¸° ìœ„í•´ bind() ë©”ì„œë“œë¥¼ ì‚¬ìš©í•œë‹¤.
		var MyClass = $Class({
			fFunc : null,
			$init : function(func){
				this.fFunc = func;
		
				this.testFunc();
			},
			testFunc : function(){
				this.fFunc();
			}
		})
		var MainClass = $Class({
			$init : function(){
				var oMyClass1 = new MyClass(this.func1);
				var oMyClass2 = new MyClass($Fn(this.func2, this).bind());
			},
			func1 : function(){
				alert(this);// thisëŠ” MyClass ë¥¼ ì˜ë¯¸í•œë‹¤.
			},
			func2 : function(){
				alert(this);// thisëŠ” MainClass ë¥¼ ì˜ë¯¸í•œë‹¤.
			}
		})
		function init(){
			var a = new MainClass();
		}
*/
nv.$Fn.prototype.bind = function() {
	//-@@$Fn.bind-@@//
	var a = nv._p_._toArray(arguments);
	var f = this._func;
	var t = this._this||this;
	var b;
	if(f.bind){
	    a.unshift(t);
	    b = Function.prototype.bind.apply(f,a);
	}else{
	    
    	b = function() {
    		var args = nv._p_._toArray(arguments);
    		// fix opera concat bug
    		if (a.length) args = a.concat(args);
    
    		return f.apply(t, args);
    	};
	}
	return b;
};
//-!nv.$Fn.prototype.bind end!-//

//-!nv.$Fn.prototype.attach start(nv.$Fn.prototype.bind, nv.$Element.prototype.attach, nv.$Element.prototype.detach)!-//
/**
 {{attach}}
 */
nv.$Fn.prototype.attach = function(oElement, sEvent, bUseCapture) {
	//-@@$Fn.attach-@@//
	var oArgs = nv.$Fn._commonPram(arguments,"$Fn#attach");
	var fn = null, l, ev = sEvent, el = oElement, ua = nv._p_._j_ag;

	if (bUseCapture !== true) {
		bUseCapture = false;
	}

	this._bUseCapture = bUseCapture;

	switch(oArgs+""){
		case "4arr":
		case "4arr2":
			var el = oArgs.aElement;
			var ev = oArgs.sEvent;
			for(var i=0, l= el.length; i < l; i++) this.attach(el[i], ev, !!bUseCapture);
			return this;
	}
	fn = this._bind = this._bind?this._bind:this.bind();
	nv.$Element(el).attach(ev,fn);

	return this;
};
//-!nv.$Fn.prototype.attach end!-//

//-!nv.$Fn.prototype.detach start!-//
/**
 {{detach}}
 */
nv.$Fn.prototype.detach = function(oElement, sEvent, bUseCapture) {
	//-@@$Fn.detach-@@//
	var oArgs = nv.$Fn._commonPram(arguments,"$Fn#detach");

	var fn = null, l, el = oElement, ev = sEvent, ua = nv._p_._j_ag;

	switch(oArgs+""){
		case "4arr":
		case "4arr2":
			var el = oArgs.aElement;
			var ev = oArgs.sEvent;
			for(var i=0, l= el.length; i < l; i++) this.detach(el[i], ev, !!bUseCapture);
			return this;

	}
	fn = this._bind = this._bind?this._bind:this.bind();
	nv.$Element(oArgs.eElement).detach(oArgs.sEvent, fn);

	return this;
};
//-!nv.$Fn.prototype.detach end!-//

//-!nv.$Fn.prototype.delay start(nv.$Fn.prototype.bind)!-//
/**
 	delay() ë©”ì„œë“œëŠ” ëž˜í•‘í•œ í•¨ìˆ˜ë¥¼ ì§€ì •í•œ ì‹œê°„ ì´í›„ì— í˜¸ì¶œí•œë‹¤.
	
	@method delay
	@param {Numeric} nSec í•¨ìˆ˜ë¥¼ í˜¸ì¶œí•  ë•Œê¹Œì§€ ëŒ€ê¸°í•  ì‹œê°„(ì´ˆ ë‹¨ìœ„).
	@param {Array+} [aArgs] í•¨ìˆ˜ë¥¼ í˜¸ì¶œí•  ë•Œ ì‚¬ìš©í•  íŒŒë¼ë¯¸í„°ë¥¼ ë‹´ì€ ë°°ì—´.
	@return {nv.$Fn} ìƒì„±ëœ nv.$Fn() ê°ì²´.
	@see nv.$Fn#bind
	@see nv.$Fn#setInterval
	@example
		function func(a, b) {
			alert(a + b);
		}
		
		$Fn(func).delay(5, [3, 5]); // 5ì´ˆ ì´í›„ì— 3, 5 ê°’ì„ ë§¤ê°œë³€ìˆ˜ë¡œ í•˜ëŠ” í•¨ìˆ˜ funcë¥¼ í˜¸ì¶œí•œë‹¤.
 */
nv.$Fn.prototype.delay = function(nSec, args) {
	//-@@$Fn.delay-@@//
	var oArgs = g_checkVarType(arguments, {
		'4num' : ['nSec:Numeric'],
		'4arr' : ['nSec:Numeric','args:Array+']
	},"$Fn#delay");
	switch(oArgs+""){
		case "4num":
			args = args || [];
			break;
		case "4arr":
			args = oArgs.args;
			
	}
	this._delayKey = setTimeout(this.bind.apply(this, args), nSec*1000);
	return this;
};
//-!nv.$Fn.prototype.delay end!-//

//-!nv.$Fn.prototype.setInterval start(nv.$Fn.prototype.bind)!-//
/**
 	setInterval() ë©”ì„œë“œëŠ” ëž˜í•‘í•œ í•¨ìˆ˜ë¥¼ ì§€ì •í•œ ì‹œê°„ ê°„ê²©ë§ˆë‹¤ í˜¸ì¶œí•œë‹¤.
	
	@method setInterval
	@param {Numeric} nSec í•¨ìˆ˜ë¥¼ í˜¸ì¶œí•  ì‹œê°„ ê°„ê²©(ì´ˆ ë‹¨ìœ„).
	@param {Array+} [aArgs] í•¨ìˆ˜ë¥¼ í˜¸ì¶œí•  ë•Œ ì‚¬ìš©í•  íŒŒë¼ë¯¸í„°ë¥¼ ë‹´ì€ ë°°ì—´.
	@return {nv.$Fn} ìƒì„±ëœ nv.$Fn() ê°ì²´.
	@see nv.$Fn#bind
	@see nv.$Fn#delay
	@example
		function func(a, b) {
			alert(a + b);
		}
		
		$Fn(func).setInterval(5, [3, 5]); // 5ì´ˆ ê°„ê²©ìœ¼ë¡œ 3, 5 ê°’ì„ ë§¤ê°œë³€ìˆ˜ë¡œ í•˜ëŠ” í•¨ìˆ˜ funcë¥¼ í˜¸ì¶œí•œë‹¤.
 */
nv.$Fn.prototype.setInterval = function(nSec, args) {
	//-@@$Fn.setInterval-@@//
	//-@@$Fn.repeat-@@//
	var oArgs = g_checkVarType(arguments, {
		'4num' : ['nSec:Numeric'],
		'4arr' : ['nSec:Numeric','args:Array+']
	},"$Fn#setInterval");
	switch(oArgs+""){
		case "4num":
			args = args || [];
			break;
		case "4arr":
			args = oArgs.args;
			
	}
	this._repeatKey = setInterval(this.bind.apply(this, args), nSec*1000);
	return this;
};
//-!nv.$Fn.prototype.setInterval end!-//

//-!nv.$Fn.prototype.repeat start(nv.$Fn.prototype.setInterval)!-//
/**
 	repeat() ë©”ì„œë“œëŠ” setInterval() ë©”ì„œë“œì™€ ë™ì¼í•˜ë‹¤.
	
	@method repeat
	@param {Numeric} nSec í•¨ìˆ˜ë¥¼ í˜¸ì¶œí•  ì‹œê°„ ê°„ê²©(ì´ˆ ë‹¨ìœ„).
	@param {Array+} [aArgs] í•¨ìˆ˜ë¥¼ í˜¸ì¶œí•  ë•Œ ì‚¬ìš©í•  íŒŒë¼ë¯¸í„°ï¿½ï¿½ï¿½ ë‹´ì€ ë°°ì—´.
	@return {nv.$Fn} ìƒì„±ëœ nv.$Fn() ê°ì²´.
	@see nv.$Fn#setInterval
	@see nv.$Fn#bind
	@see nv.$Fn#delay
	@example
		function func(a, b) {
			alert(a + b);
		}
		
		$Fn(func).repeat(5, [3, 5]); // 5ì´ˆ ê°„ê²©ìœ¼ë¡œ 3, 5 ê°’ì„ ë§¤ê°œë³€ìˆ˜ë¡œ í•˜ëŠ” í•¨ìˆ˜ funcë¥¼ í˜¸ì¶œí•œë‹¤.
 */
nv.$Fn.prototype.repeat = nv.$Fn.prototype.setInterval;
//-!nv.$Fn.prototype.repeat end!-//

//-!nv.$Fn.prototype.stopDelay start!-//
/**
 	stopDelay() ë©”ì„œë“œëŠ” delay() ë©”ì„œë“œë¡œ ì§€ì •í•œ í•¨ìˆ˜ í˜¸ì¶œì„ ì¤‘ì§€í•  ë•Œ ì‚¬ìš©í•œë‹¤.
	
	@method stopDelay
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Fn#delay
	@example
		function func(a, b) {
			alert(a + b);
		}
		
		var fpDelay = $Fn(func);
		fpDelay.delay(5, [3, 5]);
		fpDelay.stopDelay();
 */
nv.$Fn.prototype.stopDelay = function(){
	//-@@$Fn.stopDelay-@@//
	if(this._delayKey !== undefined){
		window.clearTimeout(this._delayKey);
		delete this._delayKey;
	}
	return this;
};
//-!nv.$Fn.prototype.stopDelay end!-//

//-!nv.$Fn.prototype.stopRepeat start!-//
/**
 	stopRepeat() ë©”ì„œë“œëŠ” repeat() ë©”ì„œë“œë¡œ ì§€ì •í•œ í•¨ìˆ˜ í˜¸ì¶œì„ ë©ˆì¶œ ë•Œ ì‚¬ìš©í•œë‹¤.
	
	@method stopRepeat
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Fn#repeat
	@example
		function func(a, b) {
			alert(a + b);
		}
		
		var fpDelay = $Fn(func);
		fpDelay.repeat(5, [3, 5]);
		fpDelay.stopRepeat();
 */
nv.$Fn.prototype.stopRepeat = function(){
	//-@@$Fn.stopRepeat-@@//
	if(this._repeatKey !== undefined){
		window.clearInterval(this._repeatKey);
		delete this._repeatKey;
	}
	return this;
};
//-!nv.$Fn.prototype.stopRepeat end!-//

/**
 	@fileOverview nv.$Event() ê°ì²´ì˜ ìƒì„±ìž ë° ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name event.js
	@author NAVER Ajax Platform
 */
//-!nv.$Event start!-//
/**
 	nv.$Event() ê°ì²´ëŠ” Event ê°ì²´ë¥¼ ëž˜í•‘í•˜ì—¬ ì´ë²¤íŠ¸ ì²˜ë¦¬ì™€ ê´€ë ¨ëœ í™•ìž¥ ê¸°ëŠ¥ì„ ì œê³µí•œë‹¤. ì‚¬ìš©ìžëŠ” nv.$Event() ê°ì²´ë¥¼ ì‚¬ìš©í•˜ì—¬ ë°œìƒí•œ ì´ë²¤íŠ¸ì— ëŒ€í•œ ì •ë³´ë¥¼ íŒŒì•…í•˜ê±°ë‚˜ ë™ìž‘ì„ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	
	@class nv.$Event
	@keyword event, ì´ë²¤íŠ¸
 */
/**
 	Event ê°ì²´ë¥¼ ëž˜í•‘í•œ nv.$Event() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.
	
	@constructor
	@param {Event} event Event ê°ì²´.
 */
/**
 	ì´ë²¤íŠ¸ì˜ ì¢…ë¥˜
	
	@property type
	@type String
 */
/**
 {{element}}
 */
/**
 	ì´ë²¤íŠ¸ê°€ ë°œìƒí•œ ì—˜ë¦¬ë¨¼íŠ¸
	
	@property srcElement
	@type Element
 */
/**
 	ì´ë²¤íŠ¸ê°€ ì •ì˜ëœ ì—˜ë¦¬ë¨¼íŠ¸
	
	@property currentElement
	@type Element
 */
/**
 	ì´ë²¤íŠ¸ì˜ ì—°ê´€ ì—˜ë¦¬ë¨¼íŠ¸
	
	@property relatedElement
	@type Element
 */
/**
 	delegateë¥¼ ì‚¬ìš©í•  ê²½ìš° delegateëœ ì—˜ë¦¬ë¨¼íŠ¸
	
	@property delegatedElement
	@type Element
	@example
		<div id="sample">
			<ul>
					<li><a href="#">1</a></li>
					<li>2</li>
			</ul>
		</div>
		$Element("sample").delegate("click","li",function(e){
			//li ë°‘ì— aë¥¼ í´ë¦­í•œ ê²½ìš°.
			e.srcElement -> a
			e.currentElement -> div#sample
			e.delegatedElement -> li
		});
 */
nv.$Event = (function(isMobile) {
	if(isMobile){
		return function(e){
			//-@@$Event-@@//
			var cl = arguments.callee;
			if (e instanceof cl) return e;
			if (!(this instanceof cl)) return new cl(e);
		
			this._event = this._posEvent = e;
			this._globalEvent = window.event;
			this.type = e.type.toLowerCase();
			if (this.type == "dommousescroll") {
				this.type = "mousewheel";
			} else if (this.type == "domcontentloaded") {
				this.type = "domready";
			}
			this.realType = this.type;
			
			this.isTouch = false;
			if(this.type.indexOf("touch") > -1){
				this._posEvent = e.changedTouches[0];
				this.isTouch = true;
			}
		
			this.canceled = false;
		
			this.srcElement = this.element = e.target || e.srcElement;
			this.currentElement = e.currentTarget;
			this.relatedElement = null;
			this.delegatedElement = null;
		
			if (!nv.$Jindo.isUndefined(e.relatedTarget)) {
				this.relatedElement = e.relatedTarget;
			} else if(e.fromElement && e.toElement) {
				this.relatedElement = e[(this.type=="mouseout")?"toElement":"fromElement"];
			}
		};
	}else{
		return function(e){
			//-@@$Event-@@//
			var cl = arguments.callee;
			if (e instanceof cl) return e;
			if (!(this instanceof cl)) return new cl(e);
		
			if (e === undefined) e = window.event;
			if (e === window.event && document.createEventObject) e = document.createEventObject(e);
		
		
			this.isTouch = false;
			this._event = this._posEvent = e;
			this._globalEvent = window.event;
		
			this.type = e.type.toLowerCase();
			if (this.type == "dommousescroll") {
				this.type = "mousewheel";
			} else if (this.type == "domcontentloaded") {
				this.type = "domready";
			}
		    this.realType = this.type;
			this.canceled = false;
		
			this.srcElement = this.element = e.target || e.srcElement;
			this.currentElement = e.currentTarget;
			this.relatedElement = null;
			this.delegatedElement = null;
		  
			if (e.relatedTarget !== undefined) {
				this.relatedElement = e.relatedTarget;
			} else if(e.fromElement && e.toElement) {
				this.relatedElement = e[(this.type=="mouseout")?"toElement":"fromElement"];
			}
		};
	}
})(nv._p_._JINDO_IS_MO);

//-!nv.$Event end!-//

/**
 	hook() ë©”ì„œë“œëŠ” ì´ë²¤íŠ¸ ëª…ì„ ì¡°íšŒí•œë‹¤.
	@method hook
	@syntax vName
	@static
	@param {String+} vName ì´ë²¤íŠ¸ëª…(String)
	@remark 2.5.0ë¶€í„° ì‚¬ìš©ê°€ëŠ¥í•˜ë‹¤.
	@return {Variant} ì´ë²¤íŠ¸ë¥¼ ë‚˜íƒ€ë‚´ëŠ” ê°’ í˜¹ì€ í•¨ìˆ˜.
	@example
		$Event.hook("pointerDown");
		//MsPointerDown
 	hook() ë©”ì„œë“œëŠ” ê°œë°œìžê°€ ì´ë²¤íŠ¸ë¥¼ ë§Œë“¤ë©´ ì§„ë„ì—ì„œ í•´ë‹¹ ì´ë²¤íŠ¸ê°€ ë“¤ì–´ì™”ì„ ë•Œ ë³€ê²½í•˜ì—¬ ì‚¬ìš©í•œë‹¤.
	@method hook
	@syntax vName, vValue
	@syntax oList
	@static
	@param {String+} vName ì´ë²¤íŠ¸ëª…(String)
	@param {Variant} vValue ë³€ê²½í•  ì´ë²¤íŠ¸ëª…(String|Function)
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ ì´ë²¤íŠ¸ ëª…ê³¼ ê°’ì„ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@remark 2.5.0ë¶€í„° ì‚¬ìš©ê°€ëŠ¥í•˜ë‹¤.
	@return {$Event} $Event
	
	
	@example
		$Event.hook("pointerDown","MsPointerDown");
		
		$Element("some").attach("pointerDown",function(){});
		//ê°œë°œìžê°€ hookìœ¼ë¡œ ë“±ë¡í•˜ë©´ ì§„ë„ëŠ” ì´ë²¤íŠ¸ë¥¼ í• ë‹¹í•  ë•Œ ì´ë¦„ì„ ë³€ê²½í•œë‹¤.
		//pointerDown -> MsPointerDown
	@example
		//í•¨ìˆ˜ë„ í• ë‹¹í•  ìˆ˜ ìžˆë‹¤.
		$Event.hook("pointerDown",function(){
			if(isWindow8&&isIE){
				return "MsPointerDown";
			}else if(isMobile){
				return "touchdown";
			}else{
				return "mousedown";
			}
		});
		
		$Element("some").attach("pointerDown",function(){});
		//ìœˆë„ìš°8ì´ê³  IE10ì¸ ê²½ìš°ëŠ” MsPointerDown	
		//ëª¨ë°”ì¼ì¸ ê²½ìš°ëŠ” touchdown	
		//ê¸°íƒ€ëŠ” mousedown
 */


//-!nv.$Event.nv._p_.customEvent start!-//
/**
 {{nv._p_.customEvent}}
 */

nv._p_.customEvent = {};
nv._p_.customEventStore = {};
nv._p_.normalCustomEvent = {};

nv._p_.hasCustomEvent = function(sName){
    return !!(nv._p_.getCustomEvent(sName)||nv._p_.normalCustomEvent[sName]);
};

nv._p_.getCustomEvent = function(sName){
    return nv._p_.customEvent[sName];
};

nv._p_.addCustomEventListener = function(eEle, sElementId, sEvent, vFilter,oCustomInstance){
    if(!nv._p_.customEventStore[sElementId]){
        nv._p_.customEventStore[sElementId] = {};
        nv._p_.customEventStore[sElementId].ele = eEle;
    }
    if(!nv._p_.customEventStore[sElementId][sEvent]){
        nv._p_.customEventStore[sElementId][sEvent] = {};
    }
    if(!nv._p_.customEventStore[sElementId][sEvent][vFilter]){
        nv._p_.customEventStore[sElementId][sEvent][vFilter] = {
            "custom" : oCustomInstance
        };
    }
};

nv._p_.setCustomEventListener = function(sElementId, sEvent, vFilter, aNative, aWrap){
    nv._p_.customEventStore[sElementId][sEvent][vFilter].real_listener = aNative;
    nv._p_.customEventStore[sElementId][sEvent][vFilter].wrap_listener = aWrap;
};

nv._p_.getCustomEventListener = function(sElementId, sEvent, vFilter){
    var store = nv._p_.customEventStore[sElementId];
    if(store&&store[sEvent]&&store[sEvent][vFilter]){
        return store[sEvent][vFilter];
    }
    return {};
};
 
nv._p_.getNormalEventListener = function(sElementId, sEvent, vFilter){
    var store = nv._p_.normalCustomEvent[sEvent];
    if(store&&store[sElementId]&&store[sElementId][vFilter]){
        return store[sElementId][vFilter];
    }
    return {};
};

nv._p_.hasCustomEventListener = function(sElementId, sEvent, vFilter){
    var store = nv._p_.customEventStore[sElementId];
    if(store&&store[sEvent]&&store[sEvent][vFilter]){
        return true;
    }
    return false;
};

//-!nv.$Event.customEvent start!-//
nv.$Event.customEvent = function(sName, oEvent) {
    var oArgs = g_checkVarType(arguments, {
        's4str' : [ 'sName:String+'],
        's4obj' : [ 'sName:String+', "oEvent:Hash+"]
    },"$Event.customEvent");

    
    switch(oArgs+""){
        case "s4str":
            if(nv._p_.hasCustomEvent(sName)){
                throw new nv.$Error("The Custom Event Name have to unique.");
            }else{
                nv._p_.normalCustomEvent[sName] = {};
            }

            return this;
        case "s4obj":
            if(nv._p_.hasCustomEvent(sName)){
                throw new nv.$Error("The Custom Event Name have to unique.");
            }else{
                nv._p_.normalCustomEvent[sName] = {};
                nv._p_.customEvent[sName] = function(){
                    this.name = sName;
                    this.real_listener = [];
                    this.wrap_listener = [];
                };
                var _proto = nv._p_.customEvent[sName].prototype;
                _proto.events = [];
                for(var i in oEvent){
                    _proto[i] = oEvent[i];
                    _proto.events.push(i);
                }

                nv._p_.customEvent[sName].prototype.fireEvent = function(oCustomEvent){
                    for(var i = 0, l = this.wrap_listener.length; i < l; i ++){
                        this.wrap_listener[i](oCustomEvent);
                    }
                };
            }
            return this;
    }
};
//-!nv.$Event.customEvent end!-//


//-!nv.$Event.prototype.mouse start!-//
/**
 	mouse() ë©”ì„œë“œëŠ” ë§ˆìš°ìŠ¤ ì´ë²¤íŠ¸ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method mouse
	@param {Boolean} [bIsScrollbar=false] trueì´ë©´ scrollì†ì„±ì„ ì•Œ ìˆ˜ ìžˆë‹¤. (2.0.0 ë²„ì „ë¶€í„° ì§€ì›).
	@return {Object} ë§ˆìš°ìŠ¤ ì´ë²¤íŠ¸ ì •ë³´ë¥¼ ê°–ëŠ” ê°ì²´.
		@return {Number} .delta ë§ˆìš°ìŠ¤ íœ ì„ êµ´ë¦° ì •ë„ë¥¼ ì •ìˆ˜ë¡œ ì €ìž¥í•œë‹¤. ë§ˆìš°ìŠ¤ íœ ì„ ìœ„ë¡œ êµ´ë¦° ì •ë„ëŠ” ì–‘ìˆ˜ ê°’ìœ¼ë¡œ, ì•„ëž˜ë¡œ êµ´ë¦° ì •ë„ëŠ” ìŒìˆ˜ ê°’ìœ¼ë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .left ë§ˆìš°ìŠ¤ ì™¼ìª½ ë²„íŠ¼ í´ë¦­ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .middle ë§ˆìš°ìŠ¤ ê°€ìš´ë° ë²„íŠ¼ í´ë¦­ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .right ë§ˆìš°ìŠ¤ ì˜¤ë¥¸ìª½ ë²„íŠ¼ í´ë¦­ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .scroll ì´ë²¤íŠ¸ê°€ ìŠ¤í¬ë¡¤ì—ì„œ ë°œìƒí–ˆëŠ”ì§€ë¥¼ ì•Œ ìˆ˜ ìžˆë‹¤.
	@filter desktop
	@example
		function eventHandler(evt) {
		   var mouse = evt.mouse();
		
		   mouse.delta;   // Number. íœ ì´ ì›€ì§ì¸ ì •ë„. íœ ì„ ìœ„ë¡œ êµ´ë¦¬ë©´ ì–‘ìˆ˜, ì•„ëž˜ë¡œ êµ´ë¦¬ë©´ ìŒìˆ˜.
		   mouse.left;    // ë§ˆìš°ìŠ¤ ì™¼ìª½ ë²„íŠ¼ì„ ìž…ë ¥ëœ ê²½ìš° true, ì•„ë‹ˆë©´ false
		   mouse.middle;  // ë§ˆìš°ìŠ¤ ì¤‘ê°„ ë²„íŠ¼ì„ ìž…ë ¥ëœ ê²½ìš° true, ì•„ë‹ˆë©´ false
		   mouse.right;   // ë§ˆìš°ìŠ¤ ì˜¤ë¥¸ìª½ ë²„íŠ¼ì„ ìž…ë ¥ëœ ê²½ìš° true, ì•„ë‹ˆë©´ false
		}
 */
nv.$Event.prototype.mouse = function(bIsScrollbar) {
	//-@@$Event.mouse-@@//
	g_checkVarType(arguments,{
		"voi" : [],
		"bol" : ["bIsScrollbar:Boolean"]
	});
	var e    = this._event;
	var ele  = this.srcElement;
	var delta = 0;
	var left = false,mid = false,right = false;

	var left  = e.which ? e.button==0 : !!(e.button&1);
	var mid   = e.which ? e.button==1 : !!(e.button&4);
	var right = e.which ? e.button==2 : !!(e.button&2);
	var ret   = {};

	if (e.wheelDelta) {
		delta = e.wheelDelta / 120;
	} else if (e.detail) {
		delta = -e.detail / 3;
	}
	var scrollbar;
	if(bIsScrollbar){
		scrollbar = _event_isScroll(ele,e);
	}
	
				
	ret = {
		delta  : delta,
		left   : left,
		middle : mid,
		right  : right,
		scrollbar : scrollbar
	};
	// replace method
	this.mouse = function(bIsScrollbar){
		if(bIsScrollbar){
			ret.scrollbar = _event_isScroll(this.srcElement,this._event);
			this.mouse = function(){return ret;};
		} 
		return ret;
	};

	return ret;
};
/**
 * @ignore
 */
function _event_getScrollbarSize() {
	
	var oScrollbarSize = { x : 0, y : 0 };
		
	var elDummy = nv.$([
		'<div style="',
		[
			'overflow:scroll',
			'width:100px',
			'height:100px',
			'position:absolute',
			'left:-1000px',
			'border:0',
			'margin:0',
			'padding:0'
		].join(' !important;'),
		' !important;">'
	].join(''));
	
	document.body.insertBefore(elDummy, document.body.firstChild);
	
	oScrollbarSize = {
		x : elDummy.offsetWidth - elDummy.scrollWidth,
		y : elDummy.offsetHeight - elDummy.scrollHeight
	};
	
	document.body.removeChild(elDummy);
	elDummy = null;
	
	_event_getScrollbarSize = function() {
		return oScrollbarSize;
	};
	
	return oScrollbarSize;
	
}
/**
 * @ignore
 */
function _ie_check_scroll(ele,e) {
    var iePattern = nv._p_._j_ag.match(/(?:MSIE) ([0-9.]+)/);
    if(document.body.componentFromPoint&&iePattern&& parseInt(iePattern[1],10) == 8){
        _ie_check_scroll = function(ele,e) {
            return !/HTMLGenericElement/.test(ele+"") && 
                    /(scrollbar|outside)/.test(ele.componentFromPoint(e.clientX, e.clientY)) &&
                    ele.clientHeight !== ele.scrollHeight;
        };
    }else{
        _ie_check_scroll = function(ele,e){
            return /(scrollbar|outside)/.test(ele.componentFromPoint(e.clientX, e.clientY));
        };
    }
    return _ie_check_scroll(ele,e);
}


function _event_isScroll(ele,e){
	/**
	 	// IE ì˜ ê²½ìš° componentFromPoint ë©”ì„œë“œë¥¼ ì œê³µí•˜ë¯€ë¡œ ì´ê±¸ í™œìš©
	 */
	if (ele.componentFromPoint) {
		return _ie_check_scroll(ele,e);
	}
	
	/**
	 	// íŒŒì´ì–´í­ìŠ¤ëŠ” ìŠ¤í¬ë¡¤ë°” í´ë¦­ì‹œ XUL ê°ì²´ë¡œ ì§€ì •
	 */
	if (nv._p_._JINDO_IS_FF) {
		
		try {
			var name = e.originalTarget.localName;
			return (
				name === 'thumb' ||
				name === 'slider' ||
				name === 'scrollcorner' ||
				name === 'scrollbarbutton'
			);
		} catch(ex) {
			return true;
		}
		
	}
	
	var sDisplay = nv.$Element(ele).css('display');
	if (sDisplay === 'inline') { return false; }
	
	/**
	 	// ì—˜ë¦¬ë¨¼íŠ¸ ë‚´ì—ì„œ í´ë¦­ëœ ìœ„ì¹˜ ì–»ê¸°
	 */
	var oPos = {
		x : e.offsetX || 0,
		y : e.offsetY || 0
	};
	
	/**
	 	// Webkit ì˜ ê²½ìš° border ì˜ ì‚¬ì´ì¦ˆê°€ ë”í•´ì ¸ì„œ ë‚˜ì˜´
	 */
	if (nv._p_._JINDO_IS_WK) {
		oPos.x -= ele.clientLeft;
		oPos.y -= ele.clientTop;
	}
	
	var oScrollbarSize = _event_getScrollbarSize();
	
	/**
	 	// ìŠ¤í¬ë¡¤ë°”ê°€ ìžˆëŠ” ì˜ì—­
	 */
	var oScrollPos = {
		x : [ ele.clientWidth, ele.clientWidth + oScrollbarSize.x ],
		y : [ ele.clientHeight, ele.clientHeight + oScrollbarSize.y ]
	};
	
	return (
		(oScrollPos.x[0] <= oPos.x && oPos.x <= oScrollPos.x[1]) ||
		(oScrollPos.y[0] <= oPos.y && oPos.y <= oScrollPos.y[1])
	);
}
//-!nv.$Event.prototype.mouse end!-//

//-!nv.$Event.prototype.key start!-//
/**
 	key() ë©”ì„œë“œëŠ” í‚¤ë³´ë“œ ì´ë²¤íŠ¸ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method key
	@return {Object} í‚¤ë³´ë“œ ì´ë²¤íŠ¸ ì •ë³´ë¥¼ ê°–ëŠ” ê°ì²´.
		@return {Boolean} .alt ALT í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .ctrl CTRL í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .down ì•„ëž˜ìª½ ë°©í–¥í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .enter ì—”í„°(enter)í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .esc ESC í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .keyCode ìž…ë ¥í•œ í‚¤ì˜ ì½”ë“œ ê°’ì„ ì •ìˆ˜ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .left ì™¼ìª½ ë°©í–¥í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœ ì €ìž¥í•œë‹¤.
		@return {Boolean} .meta METAí‚¤(Mac ìš© í‚¤ë³´ë“œì˜ Command í‚¤) ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .right ì˜¤ë¥¸ìª½ ë°©í–¥í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .shift Shiftí‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
		@return {Boolean} .up ìœ„ìª½ ë°©í–¥í‚¤ ìž…ë ¥ ì—¬ë¶€ë¥¼ ë¶ˆë¦¬ì–¸ í˜•íƒœë¡œ ì €ìž¥í•œë‹¤.
	@example
		function eventHandler(evt) {
		   var key = evt.key();
		
		   key.keyCode; // Number. í‚¤ë³´ë“œì˜ í‚¤ì½”ë“œ
		   key.alt;     // Alt í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.ctrl;    // Ctrl í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.meta;    // Meta í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.shift;   // Shift í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.up;      // ìœ„ìª½ í™”ì‚´í‘œ í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.down;    // ì•„ëž˜ìª½ í™”ì‚´í‘œ í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.left;    // ì™¼ìª½ í™”ì‚´í‘œ í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.right;   // ì˜¤ë¥¸ìª½ í™”ì‚´í‘œ í‚¤ë¥¼ ìž…ë ¥ëœ ê²½ìš° true.
		   key.enter;   // ë¦¬í„´í‚¤ë¥¼ ëˆŒë €ìœ¼ë©´ true
		   key.esc;   // ESCí‚¤ë¥¼ ëˆŒë €ìœ¼ë©´ true
		}
 */
nv.$Event.prototype.key = function() {
	//-@@$Event.key-@@//
	var e     = this._event;
	var k     = e.keyCode || e.charCode;
	var ret   = {
		keyCode : k,
		alt     : e.altKey,
		ctrl    : e.ctrlKey,
		meta    : e.metaKey,
		shift   : e.shiftKey,
		up      : (k == 38),
		down    : (k == 40),
		left    : (k == 37),
		right   : (k == 39),
		enter   : (k == 13),		
		esc   : (k == 27)
	};

	this.key = function(){ return ret; };

	return ret;
};
//-!nv.$Event.prototype.key end!-//

//-!nv.$Event.prototype.pos start(nv.$Element.prototype.offset)!-//
/**
 	pos() ë©”ì„œë“œëŠ” ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ ìœ„ì¹˜ ì •ë³´ë¥¼ ë‹´ê³  ìžˆëŠ” ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method pos
	@param {Boolean} [bGetOffset] ì´ë²¤íŠ¸ê°€ ë°œìƒí•œ ìš”ì†Œì—ì„œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ ìƒëŒ€ ìœ„ì¹˜ì¸ offsetX, offsetY ê°’ì„ êµ¬í•  ê²ƒì¸ì§€ë¥¼ ê²°ì •í•  íŒŒë¼ë¯¸í„°. bGetOffset ê°’ì´ trueë©´ ê°’ì„ êµ¬í•œë‹¤.
	@return {Object} ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ ìœ„ì¹˜ ì •ë³´.
		@return {Number} .clientX í™”ë©´ì„ ê¸°ì¤€ìœ¼ë¡œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ Xì¢Œí‘œë¥¼ ì €ìž¥í•œë‹¤.
		@return {Number} .clientY í™”ë©´ì„ ê¸°ì¤€ìœ¼ë¡œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ Yì¢Œí‘œë¥¼ ì €ìž¥í•œë‹¤.
		@return {Number} .offsetX DOM ìš”ì†Œë¥¼ ê¸°ì¤€ìœ¼ë¡œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ ìƒëŒ€ì ì¸ Xì¢Œí‘œë¥¼ ì €ìž¥í•œë‹¤.
		@return {Number} .offsetY DOM ìš”ì†Œë¥¼ ê¸°ì¤€ìœ¼ë¡œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ ìƒëŒ€ì ì¸ Yì¢Œí‘œë¥¼ ì €ìž¥í•œë‹¤.
		@return {Number} .pageX ë¬¸ì„œë¥¼ ê¸°ì¤€ìœ¼ë¡œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ X ì¢Œí‘œë¥¼ ì €ìž¥í•œë‹¤.
		@return {Number} .pageY ë¬¸ì„œë¥¼ ê¸°ì¤€ìœ¼ë¡œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ Yì¢Œí‘œë¥¼ ì €ìž¥í•œë‹¤.
	@remark 
		<ul class="disc">
			<li>pos() ë©”ì„œë“œë¥¼ ì‚¬ìš©í•˜ë ¤ë©´ Jindo í”„ë ˆìž„ì›Œí¬ì— $Element() ê°ì²´ê°€ í¬í•¨ë˜ì–´ ìžˆì–´ì•¼ í•œë‹¤.</li>
		</ul>
	@example
		function eventHandler(evt) {
		   var pos = evt.pos();
		
		   pos.clientX;  // í˜„ìž¬ í™”ë©´ì— ëŒ€í•œ X ì¢Œí‘œ
		   pos.clientY;  // í˜„ìž¬ í™”ë©´ì— ëŒ€í•œ Y ì¢Œí‘œ
		   pos.offsetX; // ì´ë²¤íŠ¸ê°€ ë°œìƒí•œ ì—˜ë¦¬ë¨¼íŠ¸ì— ëŒ€í•œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ ìƒëŒ€ì ì¸ Xì¢Œí‘œ (1.2.0 ì´ìƒ)
		   pos.offsetY; // ì´ë²¤íŠ¸ê°€ ë°œìƒí•œ ì—˜ë¦¬ë¨¼íŠ¸ì— ëŒ€í•œ ë§ˆìš°ìŠ¤ ì»¤ì„œì˜ ìƒëŒ€ì ì¸ Yì¢Œí‘œ (1.2.0 ì´ìƒ)
		   pos.pageX;  // ë¬¸ì„œ ì „ì²´ì— ëŒ€í•œ X ì¢Œí‘œ
		   pos.pageY;  // ë¬¸ì„œ ì „ì²´ì— ëŒ€í•œ Y ì¢Œí‘œ
		}
 */
nv.$Event.prototype.pos = function(bGetOffset) {
	//-@@$Event.pos-@@//
	g_checkVarType(arguments,{
		"voi" : [],
		"bol" : ["bGetOffset:Boolean"]
	});

	var e = this._posEvent;
	var doc = (this.srcElement.ownerDocument||document);
	var b = doc.body;
	var de = doc.documentElement;
	var pos = [b.scrollLeft || de.scrollLeft, b.scrollTop || de.scrollTop];
	var ret = {
		clientX: e.clientX,
		clientY: e.clientY,
		pageX: 'pageX' in e ? e.pageX : e.clientX+pos[0]-b.clientLeft,
		pageY: 'pageY' in e ? e.pageY : e.clientY+pos[1]-b.clientTop
	};

    /*
     ì˜¤í”„ì…‹ì„ êµ¬í•˜ëŠ” ë©”ì„œë“œì˜ ë¹„ìš©ì´ í¬ë¯€ë¡œ, ìš”ì²­ì‹œì—ë§Œ êµ¬í•˜ë„ë¡ í•œë‹¤.
     */
	if (bGetOffset && nv.$Element) {
		var offset = nv.$Element(this.srcElement).offset();
		ret.offsetX = ret.pageX - offset.left;
		ret.offsetY = ret.pageY - offset.top;
	}

	return ret;
};
//-!nv.$Event.prototype.pos end!-//

//-!nv.$Event.prototype.stop start!-//
/**
 	stop() ë©”ì„œë“œëŠ” ì´ë²¤íŠ¸ì˜ ë²„ë¸”ë§ê³¼ ê¸°ë³¸ ë™ìž‘ì„ ì¤‘ì§€ì‹œí‚¨ë‹¤. ë²„ë¸”ë§ì€ íŠ¹ì • HTML ì—˜ë¦¬ë¨¼íŠ¸ì—ì„œ ì´ë²¤íŠ¸ê°€ ë°œìƒí–ˆì„ ë•Œ ì´ë²¤íŠ¸ê°€ ìƒìœ„ ë…¸ë“œë¡œ ì „íŒŒë˜ëŠ” í˜„ìƒì´ë‹¤. ì˜ˆë¥¼ ë“¤ì–´, &lt;div&gt; ìš”ì†Œë¥¼ í´ë¦­í•  ë•Œ &lt;div&gt; ìš”ì†Œì™€ í•¨ê»˜ ìƒìœ„ ìš”ì†Œì¸ document ìš”ì†Œì—ë„ onclick ì´ë²¤íŠ¸ê°€ ë°œìƒí•œë‹¤. stop() ë©”ì„œë“œëŠ” ì§€ì •í•œ ê°ì²´ì—ì„œë§Œ ì´ë²¤íŠ¸ê°€ ë°œìƒí•˜ë„ë¡ ë²„ë¸”ë§ì„ ì°¨ë‹¨í•œë‹¤.
	
	@method stop
	@param {Numeric} [nCancelConstant=$Event.CANCEL_ALL] $Event() ê°ì²´ì˜ ìƒìˆ˜. ì§€ì •í•œ ìƒìˆ˜ì— ë”°ë¼ ì´ë²¤íŠ¸ì˜ ë²„ë¸”ë§ê³¼ ê¸°ë³¸ ë™ìž‘ì„ ì„ íƒí•˜ì—¬ ì¤‘ì§€ì‹œí‚¨ë‹¤. (1.1.3 ë²„ì „ë¶€í„° ì§€ì›).
		@param {Numeric} [nCancelConstant.$Event.CANCEL_ALL] ë²„ë¸”ë§ê³¼ ê¸°ë³¸ ë™ìž‘ì„ ëª¨ë‘ ì¤‘ì§€
		@param {Numeric} nCancelConstant.$Event.CANCEL_BUBBLE ë²„ë¸”ë§ì„ ì¤‘ì§€
		@param {Numeric} nCancelConstant.$Event.CANCEL_DEFAULT ê¸°ë³¸ ë™ìž‘ì„ ì¤‘ì§€
	@return {this} ì°½ì˜ ë²„ë¸”ë§ê³¼ ê¸°ë³¸ ë™ìž‘ì„ ì¤‘ì§€í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Event.CANCEL_ALL
	@see nv.$Event.CANCEL_BUBBLE
	@see nv.$Event.CANCEL_DEFAULT
	@example
		// ê¸°ë³¸ ë™ìž‘ë§Œ ì¤‘ì§€ì‹œí‚¤ê³  ì‹¶ì„ ë•Œ (1.1.3ë²„ì „ ì´ìƒ)
		function stopDefaultOnly(evt) {
			// Here is some code to execute
		
			// Stop default event only
			evt.stop($Event.CANCEL_DEFAULT);
		}
 */
nv.$Event.prototype.stop = function(nCancel) {
	//-@@$Event.stop-@@//
	g_checkVarType(arguments,{
		"voi" : [],
		"num" : ["nCancel:Numeric"]
	});
	nCancel = nCancel || nv.$Event.CANCEL_ALL;

	var e = (window.event && window.event == this._globalEvent)?this._globalEvent:this._event;
	var b = !!(nCancel & nv.$Event.CANCEL_BUBBLE); // stop bubbling
	var d = !!(nCancel & nv.$Event.CANCEL_DEFAULT); // stop default event
	var type = this.realType;
	if(b&&(type==="focusin"||type==="focusout")){
	    nv.$Jindo._warn("The "+type +" event can't stop bubble.");
	}

	this.canceled = true;
	
	if(d){
	    if(e.preventDefault !== undefined){
	        e.preventDefault();
	    }else{
	        e.returnValue = false;
	    }
	}
	
	if(b){
	    if(e.stopPropagation !== undefined){
	        e.stopPropagation();
	    }else{
	        e.cancelBubble = true;
	    }
	}

	return this;
};

/**
 	stopDefault() ë©”ì„œë“œëŠ” ì´ë²¤íŠ¸ì˜ ê¸°ë³¸ ë™ìž‘ì„ ì¤‘ì§€ì‹œí‚¨ë‹¤. stop() ë©”ì„œë“œì˜ íŒŒë¼ë¯¸í„°ë¡œ CANCEL_DEFAULT ê°’ì„ ìž…ë ¥í•œ ê²ƒê³¼ ê°™ë‹¤.
	
	@method stopDefault
	@return {this} ì´ë²¤íŠ¸ì˜ ê¸°ë³¸ ë™ìž‘ì„ ì¤‘ì§€í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Event#stop
	@see nv.$Event.CANCEL_DEFAULT
 */
nv.$Event.prototype.stopDefault = function(){
	return this.stop(nv.$Event.CANCEL_DEFAULT);
};

/**
 	stopBubble() ë©”ì„œë“œëŠ” ì´ë²¤íŠ¸ì˜ ë²„ë¸”ë§ì„ ì¤‘ì§€ì‹œí‚¨ë‹¤. stop() ë©”ì„œë“œì˜ íŒŒë¼ë¯¸í„°ë¡œ CANCEL_BUBBLE ê°’ì„ ìž…ë ¥í•œ ê²ƒê³¼ ê°™ë‹¤.
	
	@method stopBubble
	@return {this} ì´ë²¤íŠ¸ì˜ ë²„ë¸”ë§ì„ ì¤‘ì§€í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Event#stop
	@see nv.$Event.CANCEL_BUBBLE
 */
nv.$Event.prototype.stopBubble = function(){
	return this.stop(nv.$Event.CANCEL_BUBBLE);
};

/**
 	CANCEL_BUBBLEëŠ” stop() ë©”ì„œë“œì—ì„œ ë²„ë¸”ë§ì„ ì¤‘ì§€ì‹œí‚¬ ë•Œ ì‚¬ìš©ë˜ëŠ” ìƒìˆ˜ì´ë‹¤.
	
	@property CANCEL_BUBBLE
	@static
	@constant
	@type Number
	@default 1
	@see nv.$Event#stop
	@final
 */
nv.$Event.CANCEL_BUBBLE = 1;

/**
 	CANCEL_DEFAULTëŠ” stop() ë©”ì„œë“œì—ì„œ ê¸°ë³¸ ë™ìž‘ì„ ì¤‘ì§€ì‹œí‚¬ ë•Œ ì‚¬ìš©ë˜ëŠ” ìƒìˆ˜ì´ë‹¤.
	
	@property CANCEL_DEFAULT
	@static
	@constant
	@type Number
	@default 2
	@see nv.$Event#stop
	@final
 */
nv.$Event.CANCEL_DEFAULT = 2;

/**
 	CANCEL_ALLëŠ” stop() ë©”ì„œë“œì—ì„œ ë²„ë¸”ë§ê³¼ ê¸°ë³¸ ë™ìž‘ì„ ëª¨ë‘ ì¤‘ì§€ì‹œí‚¬ ë•Œ ì‚¬ìš©ë˜ëŠ” ìƒìˆ˜ì´ë‹¤.
	
	@property CANCEL_ALL
	@static
	@constant
	@type Number
	@default 3
	@see nv.$Event#stop
	@final
 */
nv.$Event.CANCEL_ALL = 3;
//-!nv.$Event.prototype.stop end!-//

//-!nv.$Event.prototype.$value start!-//
/**
 	$value ë©”ì„œë“œëŠ” ì›ë³¸ Event ê°ì²´ë¥¼ ë¦¬í„´í•œë‹¤
	
	@method $value
	@return {Event} ì›ë³¸ Event ê°ì²´
	@example
		function eventHandler(evt){
			evt.$value();
		}
 */
nv.$Event.prototype.$value = function() {
	//-@@$Event.$value-@@//
	return this._event;
};
//-!nv.$Event.prototype.$value end!-//

//-!nv.$Event.prototype.changedTouch start(nv.$Event.prototype.targetTouch,nv.$Event.prototype.touch)!-//
/**
 	ëª¨ë°”ì¼ì—ì„œ touchê´€ë ¨ ì´ë²¤íŠ¸ë¥¼ ì‚¬ìš©ì‹œ changeTouchesê°ì²´ë¥¼ ì¢€ ë” ì‰½ê²Œ ì‚¬ìš©í•˜ë„ë¡ í•œë‹¤.
	
	@method changedTouch
	@param {Numeric} [nIndex] ì¸ë±ìŠ¤ ë²ˆí˜¸, ì´ ì˜µì…˜ì„ ì§€ì •í•˜ì§€ ì•Šìœ¼ë©´ ê°ì¢… ì •ë³´ ë°ì´í„°ê°€ ë“¤ì–´ìžˆëŠ” ë°°ì—´ì„ ë¦¬í„´í•œë‹¤.
	@return {Array | Hash} ê°ì¢… ì •ë³´ ë°ì´í„°ê°€ ë“¤ì–´ìžˆëŠ” ë°°ì—´ ë˜ëŠ” ê°ì¢… ì •ë³´ ë°ì´í„°
	@throws {$Except.NOT_SUPPORT_METHOD} ë°ìŠ¤í¬íƒ‘ì—ì„œ ì‚¬ìš©í•  ë•Œ ì˜ˆì™¸ìƒí™© ë°œìƒ.
	@filter mobile
	@since 2.0.0 
	@see nv.$Event#targetTouch
	@see nv.$Event#pos
	@example
		$Element("only_mobile").attach("touchstart",function(e){
			e.changedTouch(0);
			{
			   "id" : "123123",// identifier
			   "event" : $Event,// $Event
			   "element" : element, // í•´ë‹¹ ì—˜ë¦¬ë¨¼íŠ¸
			   "pos" : function(){}//  ë©”ì„œë“œ (Posë©”ì„œë“œê³¼ ê°™ìŒ)
			}
			
		 	e.changedTouch();
			[
				{
				   "id" : "123123",
				   "event" : $Event,
				   "element" : element,
				   "pos" : function(){}
				},
				{
				   "id" : "123123",
				   "event" : $Event,
				   "element" : element,
				   "pos" : function(){}
				}
			]
		 });
 */
(function(aType){
	var sTouches = "Touch", sMethod = "";

	for(var i=0, l=aType.length; i < l; i++) {
        sMethod = aType[i]+sTouches;
        if(!aType[i]) { sMethod = sMethod.toLowerCase(); }

		nv.$Event.prototype[sMethod] = (function(sType) {
			return function(nIndex) {
				if(this.isTouch) {
					var oRet = [];
					var ev = this._event[sType+"es"];
					var l = ev.length;
					var e;
					for(var i = 0; i < l; i++){
						e = ev[i];
						oRet.push({
							"id" : e.identifier,
							"event" : this,
							"element" : e.target,
							"_posEvent" : e,
							"pos" : nv.$Event.prototype.pos
						});
					}
					this[sType] = function(nIndex) {
						var oArgs = g_checkVarType(arguments, {
							'void' : [  ],
							'4num' : [ 'nIndex:Numeric' ]
						},"$Event#"+sType);
						if(oArgs+"" == 'void') return oRet;
						
						return oRet[nIndex];
					};
				} else {
					this[sType] = function(nIndex) {
						throw new nv.$Error(nv.$Except.NOT_SUPPORT_METHOD,"$Event#"+sType);
					};
				}
				
				return this[sType].apply(this,nv._p_._toArray(arguments));
			};
		})(sMethod);
	}
})(["changed","target",""]);
//-!nv.$Event.prototype.changedTouch end!-//

//-!nv.$Event.prototype.targetTouch start(nv.$Event.prototype.changedTouch)!-//
/**
 	ëª¨ë°”ì¼ì—ì„œ touchê´€ë ¨ ì´ë²¤íŠ¸ë¥¼ ì‚¬ìš©ì‹œ targetTouchesê°ì²´ë¥¼ ì¢€ ë” ì‰½ê²Œ ì‚¬ìš©í•˜ë„ë¡ í•œë‹¤.
	
	@method targetTouch
	@param {Numeric} [nIndex] ì¸ë±ìŠ¤ ë²ˆí˜¸, ì´ ì˜µì…˜ì„ ì§€ì •í•˜ì§€ ì•Šìœ¼ë©´ ê°ì¢… ì •ë³´ ë°ì´í„°ê°€ ë“¤ì–´ìžˆëŠ” ë°°ì—´ì„ ë¦¬í„´í•œë‹¤.
	@return {Array | Hash} ê°ì¢… ì •ë³´ ë°ì´í„°ê°€ ë“¤ì–´ìžˆëŠ” ë°°ì—´ ë˜ëŠ” ê°ì¢… ì •ë³´ ë°ì´í„°
	@throws {$Except.NOT_SUPPORT_METHOD} ë°ìŠ¤í¬íƒ‘ì—ì„œ ì‚¬ìš©í•  ë•Œ ì˜ˆì™¸ìƒí™© ë°œìƒ.
	@filter mobile
	@since 2.0.0
	@see nv.$Event#changedTouch
	@see nv.$Event#pos
	@example
		$Element("only_mobile").attach("touchstart",function(e){
			e.targetTouch(0);
			{
			   "id" : "123123",// identifier
			   "event" : $Event,// $Event
			   "element" : element, // í•´ë‹¹ ì—˜ë¦¬ë¨¼íŠ¸
			   "pos" : function(){}//  ë©”ì„œë“œ (Posë©”ì„œë“œê³¼ ê°™ìŒ)
			}
			
			e.targetTouch();
			[
				{
				   "id" : "123123",
				   "event" : $Event,
				   "element" : element,
				   "pos" : function(){}
				},
				{
				   "id" : "123123",
				   "event" : $Event,
				   "element" : element,
				   "pos" : function(){}
				}
			]
		 });
 */
//-!nv.$Event.prototype.targetTouch end!-//

//-!nv.$Event.prototype.touch start(nv.$Event.prototype.changedTouch)!-//
/**
 	ëª¨ë°”ì¼ì—ì„œ touchê´€ë ¨ ì´ë²¤íŠ¸ë¥¼ ì‚¬ìš©ì‹œ touchesê°ì²´ë¥¼ ì¢€ ë” ì‰½ê²Œ ì‚¬ìš©í•˜ë„ë¡ í•œë‹¤.

	@method touch
	@param {Numeric} [nIndex] ì¸ë±ìŠ¤ ë²ˆí˜¸, ì´ ì˜µì…˜ì„ ì§€ì •í•˜ì§€ ì•Šìœ¼ë©´ ê°ì¢… ì •ë³´ ë°ì´í„°ê°€ ë“¤ì–´ìžˆëŠ” ë°°ì—´ì„ ë¦¬í„´í•œë‹¤.
	@return {Array | Hash} ê°ì¢… ì •ë³´ ë°ì´í„°ê°€ ë“¤ì–´ìžˆëŠ” ë°°ì—´ ë˜ëŠ” ê°ì¢… ì •ë³´ ë°ì´í„°
	@throws {$Except.NOT_SUPPORT_METHOD} ë°ìŠ¤í¬íƒ‘ì—ì„œ ì‚¬ìš©í•  ë•Œ ì˜ˆì™¸ìƒí™© ë°œìƒ.
	@filter mobile
	@since 2.0.0
	@see nv.$Event#changedTouch
	@see nv.$Event#pos
	@example
		$Element("only_mobile").attach("touchstart",function(e){
			e.touch(0);
			{
			   "id" : "123123",// identifier
			   "event" : $Event,// $Event
			   "element" : element, // í•´ë‹¹ ì—˜ë¦¬ë¨¼íŠ¸
			   "pos" : function(){}//  ë©”ì„œë“œ (Posë©”ì„œë“œê³¼ ê°™ìŒ)
			}

			e.touch();
			[
				{
				   "id" : "123123",
				   "event" : $Event,
				   "element" : element,
				   "pos" : function(){}
				},
				{
				   "id" : "123123",
				   "event" : $Event,
				   "element" : element,
				   "pos" : function(){}
				}
			]
		 });
 */
//-!nv.$Event.prototype.touch end!-//

/**
 	@fileOverview $Elementì˜ ìƒì„±ìž ë° ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name element.js
	@author NAVER Ajax Platform
 */
//-!nv.$Element start(nv.$)!-//
/**
 	nv.$Element() ê°ì²´ëŠ” HTML ìš”ì†Œë¥¼ ëž˜í•‘(wrapping)í•˜ë©°, í•´ë‹¹ ìš”ì†Œë¥¼ ì¢€ ë” ì‰½ê²Œ ë‹¤ë£° ìˆ˜ ìžˆëŠ” ê¸°ëŠ¥ì„ ì œê³µí•œë‹¤.
	
	@class nv.$Element
	@keyword element, ì—˜ë¦¬ë¨¼íŠ¸
 */
/**
 	nv.$Element() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.
	 
	@constructor
	@param {Variant} vElement nv.$Element() ê°ì²´ ìƒì„±ìžëŠ” ë¬¸ìžì—´(String), HTML ìš”ì†Œ(Element+|Node|Document+|Window+), ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.<br>
		<ul class="disc">
			<li>íŒŒë¼ë¯¸í„°ê°€ ë¬¸ìžì—´ì´ë©´ ë‘ ê°€ì§€ ë°©ì‹ìœ¼ë¡œ ë™ìž‘í•œë‹¤.
				<ul class="disc">
					<li>ë§Œì¼ "&lt;tagName&gt;"ê³¼ ê°™ì€ í˜•ì‹ì˜ ë¬¸ìžì—´ì´ë©´ tagNameì„ ê°€ì§€ëŠ” ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.</li>
					<li>ê·¸ ì´ì™¸ì˜ ê²½ìš° ì§€ì •í•œ ë¬¸ìžì—´ì„ IDë¡œ ê°–ëŠ” HTML ìš”ì†Œë¥¼ ì‚¬ìš©í•˜ì—¬ nv.$Element() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.</li>
				</ul>
			</li>
			<li>íŒŒë¼ë¯¸í„°ê°€ HTML ìš”ì†Œì´ë©´ í•´ë‹¹ ìš”ì†Œë¥¼ ëž˜í•‘í•˜ì—¬ $Element() ë¥¼ ìƒì„±í•œë‹¤.</li>
			<li>íŒŒë¼ë¯¸í„°ê°€ $Element()ì´ë©´ ì „ë‹¬ëœ íŒŒë¼ë¯¸í„°ë¥¼ ê·¸ëŒ€ë¡œ ë°˜í™˜í•œë‹¤.</li>
			<li>íŒŒë¼ë¯¸í„°ê°€ undefined í˜¹ì€ nullì¸ ê²½ìš° nullì„ ë°˜í™˜í•œë‹¤.</li>
		</ul>
	@return {nv.$Element} ìƒì„±ëœ nv.$Element() ê°ì²´.
	@example
		var element = $Element($("box")); // HTML ìš”ì†Œë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •
		var element = $Element("box"); // HTML ìš”ì†Œì˜ idë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •
		var element = $Element("<div>"); // íƒœê·¸ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •, DIV ì—˜ë¦¬ë¨¼íŠ¸ë¥¼ ìƒì„±í•˜ì—¬ ëž˜í•‘í•¨
 */
nv.$Element = function(el) {
    //-@@$Element-@@//
    var cl = arguments.callee;
    if (el && el instanceof cl) return el;  
    
    if (!(this instanceof cl)){
        try {
            nv.$Jindo._maxWarn(arguments.length, 1,"$Element");
            return new cl(el);
        } catch(e) {
            if (e instanceof TypeError) { return null; }
            throw e;
        }
    }   
    var cache = nv.$Jindo;
    var oArgs = cache.checkVarType(arguments, {
        '4str' : [ 'sID:String+' ],
        '4nod' : [ 'oEle:Node' ],
        '4doc' : [ 'oEle:Document+' ],
        '4win' : [ 'oEle:Window+' ]
    },"$Element");
    switch(oArgs + ""){
        case "4str":
            el = nv.$(el);
            break;
        default:
            el = oArgs.oEle;
    }
    
    this._element = el;
    if(this._element != null){
        if(this._element.__nv__id){
            this._key = this._element.__nv__id; 
        }else{
            try{
                this._element.__nv__id = this._key = nv._p_._makeRandom();
            }catch(e){}
        }
        // tagname
        this.tag = (this._element.tagName||'').toLowerCase();
    }else{
        throw new TypeError("{not_found_element}");
    }

};
nv._p_.NONE_GROUP = "_nv_event_none";
nv._p_.splitEventSelector = function(sEvent){
    var matches = sEvent.match(/^([a-z_]*)(.*)/i);
    var eventName = nv._p_.trim(matches[1]);
    var selector = nv._p_.trim(matches[2].replace("@",""));
    return {
        "type"      : selector?"delegate":"normal",
        "event"     : eventName,
        "selector"  : selector
    };
};
nv._p_._makeRandom = function(){
    return "e"+ new Date().getTime() + parseInt(Math.random() * 100000000,10);
};

nv._p_.releaseEventHandlerForAllChildren = function(wel){
	var children = wel._element.all || wel._element.getElementsByTagName("*"),
		nChildLength = children.length,
		elChild = null,
		i;
	
	for(i = 0; i < nChildLength; i++){
		elChild = children[i];
		
		if(elChild.nodeType == 1 && elChild.__nv__id){
			nv.$Element.eventManager.cleanUpUsingKey(elChild.__nv__id, true);
		}
	}
	
	children = elChild = null;
};

nv._p_.canUseClassList = function(){
    var result = "classList" in document.body&&"classList" in document.createElementNS("http://www.w3.org/2000/svg", "g");
    nv._p_.canUseClassList = function(){
        return result;
    };
    return nv._p_.canUseClassList();
};

nv._p_.vendorPrefixObj = {
    "-moz" : "Moz",
    "-ms" : "ms",
    "-o" : "O",
    "-webkit" : "webkit"
};

nv._p_.cssNameToJavaScriptName = function(sName){
    if(/^(\-(?:moz|ms|o|webkit))/.test(sName)){
        var vandorPerfix = RegExp.$1;
        sName = sName.replace(vandorPerfix,nv._p_.vendorPrefixObj[vandorPerfix]);
    }
    
    return sName.replace(/(:?-(\w))/g,function(_,_,m){
       return m.toUpperCase();
    });
};

//-!nv.$Element._getTransition.hidden start!-//
/**
 {{sign_getTransition}}
 */

nv._p_.getStyleIncludeVendorPrefix = function(_test){
    var styles = ["Transition","Transform","Animation","Perspective"];
    var vendors = ["webkit","-","Moz","O","ms"];

    // when vender prefix is not present,  the value will be taken from  prefix
    var style  = "";
    var vendor = "";
    var vendorStyle = "";
    var result = {};
    
    var styleObj = _test||document.body.style;
    for(var i = 0, l = styles.length; i < l; i++){
        style = styles[i];
        
        for(var j = 0, m = vendors.length; j < m; j++ ){
            vendor = vendors[j];
            vendorStyle = vendor!="-"?(vendor+style):style.toLowerCase(); 
            if(typeof styleObj[vendorStyle] !== "undefined"){
                result[style.toLowerCase()] = vendorStyle;
                break;
            }
            result[style.toLowerCase()] = false;
        }    
    }
    
    if(_test){
        return result;
    }
    
    nv._p_.getStyleIncludeVendorPrefix = function(){
        return result;
    };
    
    return nv._p_.getStyleIncludeVendorPrefix();
};

nv._p_.getTransformStringForValue = function(_test){
    var info = nv._p_.getStyleIncludeVendorPrefix(_test);
    var transform = info.transform ;
    if(info.transform === "MozTransform"){
        transform = "-moz-transform";
    }else if(info.transform === "webkitTransform"){
        transform = "-webkit-transform";
    }else if(info.transform === "OTransform"){
        transform = "-o-transform";
    }else if(info.transform === "msTransform"){
        transform = "-ms-transform";
    }
    
    if(_test){
        return transform;
    }
    
    nv._p_.getTransformStringForValue = function(){
        return transform;
    };
    
    return nv._p_.getTransformStringForValue();
};
/*
 {{disappear_1}}
 */
// To prevent blink issue on Android 4.0.4 Samsung Galaxy 2 LTE model, calculate offsetHeight first
nv._p_.setOpacity = function(ele,val){
    ele.offsetHeight;
    ele.style.opacity = val;
};
//-!nv.$Element._getTransition.hidden end!-//

/**
 	@method _eventBind
	@ignore
 */
nv.$Element._eventBind = function(oEle,sEvent,fAroundFunc,bUseCapture){
    if(oEle.addEventListener){
        if(document.documentMode == 9){
            nv.$Element._eventBind = function(oEle,sEvent,fAroundFunc,bUseCapture){
                if(/resize/.test(sEvent) ){
                    oEle.attachEvent("on"+sEvent,fAroundFunc);
                }else{
                    oEle.addEventListener(sEvent, fAroundFunc, !!bUseCapture);
                }
            };
        }else{
            nv.$Element._eventBind = function(oEle,sEvent,fAroundFunc,bUseCapture){
                oEle.addEventListener(sEvent, fAroundFunc, !!bUseCapture);
            };
        }
    }else{
        nv.$Element._eventBind = function(oEle,sEvent,fAroundFunc){
            oEle.attachEvent("on"+sEvent,fAroundFunc);
        };
    }
    nv.$Element._eventBind(oEle,sEvent,fAroundFunc,bUseCapture);
};

/**
 	@method _unEventBind
	@ignore
 */
nv.$Element._unEventBind = function(oEle,sEvent,fAroundFunc){
    if(oEle.removeEventListener){
        if(document.documentMode == 9){
            nv.$Element._unEventBind = function(oEle,sEvent,fAroundFunc){
                if(/resize/.test(sEvent) ){
                    oEle.detachEvent("on"+sEvent,fAroundFunc);
                }else{
                    oEle.removeEventListener(sEvent,fAroundFunc,false);
                }
            };
        }else{
            nv.$Element._unEventBind = function(oEle,sEvent,fAroundFunc){
                oEle.removeEventListener(sEvent,fAroundFunc,false);
            };
        }
    }else{
        nv.$Element._unEventBind = function(oEle,sEvent,fAroundFunc){
            oEle.detachEvent("on"+sEvent,fAroundFunc);
        };
    }
    nv.$Element._unEventBind(oEle,sEvent,fAroundFunc);
};
//-!nv.$Element end!-//


//-!nv.$Element.prototype.$value start!-//
/**
 	$value() ë©”ì„œë“œëŠ” ì›ëž˜ì˜ HTML ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method $value
	@return {Element} nv.$Element() ê°ì²´ê°€ ê°ì‹¸ê³  ìžˆëŠ” ì›ë³¸ ìš”ì†Œ.
	@see nv.$Element
	@example
		var element = $Element("sample_div");
		element.$value(); // ì›ëž˜ì˜ ì—˜ë¦¬ë¨¼íŠ¸ê°€ ë°˜í™˜ëœë‹¤.
 */
nv.$Element.prototype.$value = function() {
    //-@@$Element.$value-@@//
    return this._element;
};
//-!nv.$Element.prototype.$value end!-//

//-!nv.$Element.prototype.visible start(nv.$Element.prototype._getCss,nv.$Element.prototype.show,nv.$Element.prototype.hide)!-//
/**
 	visible() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ display ì†ì„±ì„ ì¡°íšŒí•œë‹¤.
	
	@method visible
	@return {Boolean} display ì—¬ë¶€. display ì†ì„±ì´ noneì´ë©´ false ê°’ì„ ë°˜í™˜í•œë‹¤.
	@example
		<div id="sample_div" style="display:none">Hello world</div>
		
		// ì¡°íšŒ
		$Element("sample_div").visible(); // false 
 */
/**
 	visible() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ display ì†ì„±ì„ ì„¤ì •í•œë‹¤.
	
	@method visible
	@param {Boolean} bVisible í•´ë‹¹ ìš”ì†Œì˜ í‘œì‹œ ì—¬ë¶€.<br>ìž…ë ¥í•œ íŒŒë¼ë¯¸í„°ê°€ trueì¸ ê²½ìš° display ì†ì„±ì„ ì„¤ì •í•˜ê³ , falseì¸ ê²½ìš°ì—ëŠ” display ì†ì„±ì„ noneìœ¼ë¡œ ë³€ê²½í•œë‹¤. Booleanì´ ì•„ë‹Œ ê°’ì´ ë“¤ì–´ì˜¨ ê²½ìš°ëŠ” ToBooleaní•œ ê²°ê³¼ë¥¼ ê¸°ì¤€ìœ¼ë¡œ ë³€ê²½í•œë‹¤.
	@param {String+} sDisplay í•´ë‹¹ ìš”ì†Œì˜ display ì†ì„± ê°’.<br>bVisible íŒŒë¼ë¯¸í„°ê°€ true ì´ë©´ sDisplay ê°’ì„ display ì†ì„±ìœ¼ë¡œ ì„¤ì •í•œë‹¤.
	@return {this} display ì†ì„±ì„ ë³€ê²½í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 
		<ul class="disc">
			<li>1.1.2 ë²„ì „ë¶€í„° bVisible íŒŒë¼ë¯¸í„°ë¥¼ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.</li>
			<li>1.4.5 ë²„ì „ë¶€í„° sDisplay íŒŒë¼ë¯¸í„°ë¥¼ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.</li>
		</ul>
	@see http://www.w3.org/TR/2008/REC-CSS2-20080411/visuren.html#display-prop display ì†ì„± - W3C CSS2 Specification
	@see nv.$Element#show
	@see nv.$Element#hide
	@see nv.$Element#toggle
	@example
		// í™”ë©´ì— ë³´ì´ë„ë¡ ì„¤ì •
		$Element("sample_div").visible(true, 'block');
		
		//Before
		<div id="sample_div" style="display:none">Hello world</div>
		
		//After
		<div id="sample_div" style="display:block">Hello world</div>
 */
nv.$Element.prototype.visible = function(bVisible, sDisplay) {
    //-@@$Element.visible-@@//
    var oArgs = g_checkVarType(arguments, {
        'g' : [  ],
        's4bln' : [ nv.$Jindo._F('bVisible:Boolean') ],
        's4str' : [ 'bVisible:Boolean', "sDisplay:String+"]
    },"$Element#visible");
    switch(oArgs+""){
        case "g":
            return (this._getCss(this._element,"display") != "none");
            
        case "s4bln":
            this[bVisible?"show":"hide"]();
            return this;
            
        case "s4str":
            this[bVisible?"show":"hide"](sDisplay);
            return this;
                    
    }
};
//-!nv.$Element.prototype.visible end!-//

//-!nv.$Element.prototype.show start!-//
/**
 	show() ë©”ì„œë“œëŠ” HTML ìš”ì†Œê°€ í™”ë©´ì— ë³´ì´ë„ë¡ display ì†ì„±ì„ ë³€ê²½í•œë‹¤.
	
	@method show
	@param {String+} [sDisplay] display ì†ì„±ì— ì§€ì •í•  ê°’.<br>íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ íƒœê·¸ë³„ë¡œ ë¯¸ë¦¬ ì§€ì •ëœ ê¸°ë³¸ê°’ì´ ì†ì„± ê°’ìœ¼ë¡œ ì„¤ì •ëœë‹¤. ë¯¸ë¦¬ ì§€ì •ëœ ê¸°ë³¸ê°’ì´ ì—†ìœ¼ë©´ "inline"ìœ¼ë¡œ ì„¤ì •ëœë‹¤. ì—ëŸ¬ê°€ ë°œìƒí•œ ê²½ìš°ëŠ” "block"ìœ¼ë¡œ ì„¤ì •ëœë‹¤.
	@return {this} display ì†ì„±ì„ ë³€ê²½í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 1.4.5 ë²„ì „ë¶€í„° sDisplay íŒŒë¼ë¯¸í„°ë¥¼ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	@see http://www.w3.org/TR/2008/REC-CSS2-20080411/visuren.html#display-prop display ì†ì„± - W3C CSS2 Specification
	@see nv.$Element#hide
	@see nv.$Element#toggle
	@see nv.$Element#visible
	@example
		// í™”ë©´ì— ë³´ì´ë„ë¡ ì„¤ì •
		$Element("sample_div").show();
		
		//Before
		<div id="sample_div" style="display:none">Hello world</div>
		
		//After
		<div id="sample_div" style="display:block">Hello world</div>
 */
nv.$Element.prototype.show = function(sDisplay) {
    //-@@$Element.show-@@//
    var oArgs = g_checkVarType(arguments, {
        '4voi' : [  ],
        '4str' : ["sDisplay:String+"]
    },"$Element#show");
    
    
    var s = this._element.style;
    var b = "block";
    var c = { p:b,div:b,form:b,h1:b,h2:b,h3:b,h4:b,ol:b,ul:b,fieldset:b,td:"table-cell",th:"table-cell",
              li:"list-item",table:"table",thead:"table-header-group",tbody:"table-row-group",tfoot:"table-footer-group",
              tr:"table-row",col:"table-column",colgroup:"table-column-group",caption:"table-caption",dl:b,dt:b,dd:b};
    try {
        switch(oArgs+""){
            case "4voi":
                var type = c[this.tag];
                s.display = type || "inline";
                break;
            case "4str":
                s.display = sDisplay;
                
        }
    } catch(e) {
        /*
         IEì—ì„œ sDisplayê°’ì´ ë¹„ì •ìƒì ì¼ë•Œ blockë¡œ ì…‹íŒ…í•œë‹¤.
         */
        s.display = "block";
    }

    return this;
};
//-!nv.$Element.prototype.show end!-//

//-!nv.$Element.prototype.hide start!-//
/**
 	hide() ë©”ì„œë“œëŠ” HTML ìš”ì†Œê°€ í™”ë©´ì— ë³´ì´ì§€ ì•Šë„ë¡ display ì†ì„±ì„ noneìœ¼ë¡œ ë³€ê²½í•œë‹¤.
	
	@method hide
	@return {this} display ì†ì„±ì„ noneìœ¼ë¡œ ë³€ê²½í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see http://www.w3.org/TR/2008/REC-CSS2-20080411/visuren.html#display-prop display ì†ì„± - W3C CSS2 Specification
	@see nv.$Element#show
	@see nv.$Element#toggle
	@see nv.$Element#visible
	@example
		// í™”ë©´ì— ë³´ì´ì§€ ì•Šë„ë¡ ì„¤ì •
		$Element("sample_div").hide();
		
		//Before
		<div id="sample_div" style="display:block">Hello world</div>
		
		//After
		<div id="sample_div" style="display:none">Hello world</div>
 */
nv.$Element.prototype.hide = function() {
    //-@@$Element.hide-@@//
    this._element.style.display = "none";

    return this;
};
//-!nv.$Element.prototype.hide end!-//

//-!nv.$Element.prototype.toggle start(nv.$Element.prototype._getCss,nv.$Element.prototype.show,nv.$Element.prototype.hide)!-//
/**
 	toggle() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ display ì†ì„±ì„ ë³€ê²½í•˜ì—¬ í•´ë‹¹ ìš”ì†Œë¥¼ í™”ë©´ì— ë³´ì´ê±°ë‚˜, ë³´ì´ì§€ ì•Šê²Œ í•œë‹¤. ì´ ë©”ì„œë“œëŠ” ë§ˆì¹˜ ìŠ¤ìœ„ì¹˜ë¥¼ ì¼œê³  ë„ëŠ” ê²ƒê³¼ ê°™ì´ ìš”ì†Œì˜ í‘œì‹œ ì—¬ë¶€ë¥¼ ë°˜ì „ì‹œí‚¨ë‹¤.
	
	@method toggle
	@param {String+} [sDisplay] í•´ë‹¹ ìš”ì†Œê°€ ë³´ì´ë„ë¡ ë³€ê²½í•  ë•Œ display ì†ì„±ì— ì§€ì •í•  ê°’. íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ íƒœê·¸ë³„ë¡œ ë¯¸ë¦¬ ì§€ì •ëœ ê¸°ë³¸ê°’ì´ ì†ì„± ê°’ìœ¼ë¡œ ì„¤ì •ëœë‹¤. ë¯¸ë¦¬ ì§€ì •ëœ ê¸°ë³¸ê°’ì´ ì—†ìœ¼ë©´ "inline"ìœ¼ë¡œ ì„¤ì •ëœë‹¤.
	@return {this} display ì†ì„±ì„ ë³€ê²½í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 1.4.5 ë²„ì „ë¶€í„° ë³´ì´ë„ë¡ ì„¤ì •í•  ë•Œ sDisplay ê°’ìœ¼ë¡œ display ì†ì„± ê°’ ì§€ì •ì´ ê°€ëŠ¥í•˜ë‹¤.
	@see http://www.w3.org/TR/2008/REC-CSS2-20080411/visuren.html#display-prop display ì†ì„± - W3C CSS2 Specification
	@see nv.$Element#show
	@see nv.$Element#hide
	@see nv.$Element#visible
	@example
		// í™”ë©´ì— ë³´ì´ê±°ë‚˜, ë³´ì´ì§€ ì•Šë„ë¡ ì²˜ë¦¬
		$Element("sample_div1").toggle();
		$Element("sample_div2").toggle();
		
		//Before
		<div id="sample_div1" style="display:block">Hello</div>
		<div id="sample_div2" style="display:none">Good Bye</div>
		
		//After
		<div id="sample_div1" style="display:none">Hello</div>
		<div id="sample_div2" style="display:block">Good Bye</div>
 */
nv.$Element.prototype.toggle = function(sDisplay) {
    //-@@$Element.toggle-@@//
    var oArgs = g_checkVarType(arguments, {
        '4voi' : [  ],
        '4str' : ["sDisplay:String+"]
    },"$Element#toggle");
    
    this[this._getCss(this._element,"display")=="none"?"show":"hide"].apply(this,arguments);
    return this;
};
//-!nv.$Element.prototype.toggle end!-//

//-!nv.$Element.prototype.opacity start!-//
/**
 	opacity() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ íˆ¬ëª…ë„(opacity ì†ì„±) ê°’ì„ ê°€ì ¸ì˜¨ë‹¤.
	
	@method opacity
	@return {Numeric} opacityê°’ì„ ë°˜í™˜í•œë‹¤.
	@example
		<div id="sample" style="background-color:#2B81AF; width:20px; height:20px;"></div>
		
		// ì¡°íšŒ
		$Element("sample").opacity();	// 1
 */
/**
 	opacity() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ íˆ¬ëª…ë„(opacity ì†ì„±) ê°’ì„ ì„¤ì •í•œë‹¤.
	
	@method opacity
	@param {Variant} vValue ì„¤ì •í•  íˆ¬ëª…ë„ ê°’(String|Numeric). íˆ¬ëª…ë„ ê°’ì€ 0ì—ì„œ 1 ì‚¬ì´ì˜ ì‹¤ìˆ˜ ê°’ìœ¼ë¡œ ì§€ì •í•œë‹¤. ì§€ì •í•œ íŒŒë¼ë¯¸í„°ì˜ ê°’ì´ 0ë³´ë‹¤ ìž‘ìœ¼ë©´ 0ì„, 1ë³´ë‹¤ í¬ë©´ 1ì„ ì„¤ì •í•œë‹¤. ë¹ˆë¬¸ìžì—´ì¸ ê²½ìš°, ì„¤ì •ëœ opacity ì†ì„±ì„ ì œê±°í•œë‹¤.
	@return {this} opacity ì†ì„±ì„ ë³€ê²½í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		// íˆ¬ëª…ë„ ê°’ ì„¤ì •
		$Element("sample").opacity(0.4);
		
		//Before
		<div style="background-color: rgb(43, 129, 175); width: 20px; height: 20px;" id="sample"></div>
		
		//After
		<div style="background-color: rgb(43, 129, 175); width: 20px; height: 20px; opacity: 0.4;" id="sample"></div>
 */
nv.$Element.prototype.opacity = function(value) {
    //-@@$Element.opacity-@@//
    var oArgs = g_checkVarType(arguments, {
                'g' : [  ],
                's' : ["nOpacity:Numeric"],
                'str' : ['sOpacity:String']
            },"$Element#opacity"),
        e = this._element,
        b = (this._getCss(e,"display") != "none"), v;

    switch(oArgs+""){
        case "g":
            if(typeof e.style.opacity != 'undefined' && (v = e.style.opacity).length || (v = this._getCss(e,"opacity"))) {
                v = parseFloat(v);
                if (isNaN(v)) v = b?1:0;
            } else {
                v = typeof e.filters.alpha == 'undefined'?(b?100:0):e.filters.alpha.opacity;
                v = v / 100;
            }
            return v;   
            
        case "s":
             /*
             IEì—ì„œ layoutì„ ê°€ì§€ê³  ìžˆì§€ ì•Šìœ¼ë©´ opacityê°€ ì ìš©ë˜ì§€ ì•ŠìŒ.
             */
            value = oArgs.nOpacity;
            e.style.zoom = 1;
            value = Math.max(Math.min(value,1),0);
            
            if (typeof e.style.opacity != 'undefined') {
                e.style.opacity = value;
            } else {
                value = Math.ceil(value*100);
                
                if (typeof e.filters != 'unknown' && typeof e.filters.alpha != 'undefined') {
                    e.filters.alpha.opacity = value;
                } else {
                    e.style.filter = (e.style.filter + " alpha(opacity=" + value + ")");
                }       
            }
            return this;

        case "str":
             /*
             íŒŒë¼ë¯¸í„° ê°’ì´ ë¹„ì–´ìžˆëŠ” ë¬¸ìžì¸ ê²½ìš°, opacity ì†ì„±ì„ ì œê±°í•œë‹¤.
             */
            if(value === "") {
                e.style.zoom = e.style.opacity = "";
            }
            return this;
    }
    
};
//-!nv.$Element.prototype.opacity end!-//

//-!nv.$Element.prototype.css start(nv.$Element.prototype.opacity,nv.$Element.prototype._getCss,nv.$Element.prototype._setCss)!-//
/**
 	css() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ CSS ì†ì„± ê°’ì„ ì¡°íšŒí•œë‹¤.
	@method css
	@param {String+} vName CSS ì†ì„± ì´ë¦„(String)
	@return {String} CSS ì†ì„± ê°’ì„ ë°˜í™˜í•œë‹¤.
	@throws {nv.$Except.NOT_USE_CSS} cssì„ ì‚¬ìš©í•  ìˆ˜ ì—†ëŠ” ì—˜ë¦¬ë¨¼íŠ¸ ì¼ ë•Œ.
	@remark 
		<ul class="disc">
			<li>CSS ì†ì„±ì€ ì¹´ë©œ í‘œê¸°ë²•(Camel Notation)ì„ ì‚¬ìš©í•œë‹¤. ì˜ˆë¥¼ ë“¤ë©´ border-width-bottom ì†ì„±ì€ borderWidthBottomìœ¼ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.</li>
			<li>2.6.0 ì´ìƒì—ì„œëŠ” ì¼ë°˜ì ì€ ìŠ¤íƒ€ì¼ ë¬¸ë²•ê³¼ ì¹´ë©œ í‘œê¸°ë²ˆ ëª¨ë‘ ì‚¬ìš©ê°€ëŠ¥í•˜ë‹¤.ì˜ˆë¥¼ ë“¤ë©´ border-width-bottom, borderWidthBottom ëª¨ë‘ ê°€ëŠ¥í•˜ë‹¤.</li>
			<li>float ì†ì„±ì€ JavaScriptì˜ ì˜ˆì•½ì–´ë¡œ ì‚¬ìš©ë˜ë¯€ë¡œ css() ë©”ì„œë“œì—ì„œëŠ” float ëŒ€ì‹  cssFloatì„ ì‚¬ìš©í•œë‹¤(Internet Explorerì—ì„œëŠ” styleFloat, ê·¸ ì™¸ì˜ ë¸Œë¼ìš°ì €ì—ì„œëŠ” cssFloatë¥¼ ì‚¬ìš©í•œë‹¤.).</li>
		</ul>
	@see nv.$Element#attr
	@example
		<style type="text/css">
			#btn {
				width: 120px;
				height: 30px;
				background-color: blue;
			}
		</style>
		
		<span id="btn"></span>
		
		// CSS ì†ì„± ê°’ ì¡°íšŒ
		$Element('btn').css('backgroundColor');		// rgb (0, 0, 255)
 */
/**
 	css() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ CSS ì†ì„± ê°’ì„ ì„¤ì •í•œë‹¤.
	
	@method css
	@syntax vName, vValue
	@syntax oList
	@param {String+} vName CSS ì†ì„± ì´ë¦„(String)
	@param {String+ | Numeric} vValue CSS ì†ì„±ì— ì„¤ì •í•  ê°’. ìˆ«ìž(Number) í˜¹ì€ ë‹¨ìœ„ë¥¼ í¬í•¨í•œ ë¬¸ìžì—´(String)ì„ ì‚¬ìš©í•œë‹¤.
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ CSS ì†ì„±ê³¼ ê°’ì„ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@return {this} CSS ì†ì„± ê°’ì„ ë°˜ì˜í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@throws {nv.$Except.NOT_USE_CSS} cssì„ ì‚¬ìš©í•  ìˆ˜ ì—†ëŠ” ì—˜ë¦¬ë¨¼íŠ¸ ì¼ ë•Œ.
	@remark 
		<ul class="disc">
			<li>CSS ì†ì„±ì€ ì¹´ë©œ í‘œê¸°ë²•(Camel Notation)ì„ ì‚¬ìš©í•œë‹¤. ì˜ˆë¥¼ ë“¤ë©´ border-width-bottom ì†ì„±ì€ borderWidthBottomìœ¼ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.</li>
			<li>2.6.0 ì´ìƒì—ì„œëŠ” ì¼ë°˜ì ì€ ìŠ¤íƒ€ì¼ ë¬¸ë²•ê³¼ ì¹´ë©œ í‘œê¸°ë²ˆ ëª¨ë‘ ì‚¬ìš©ê°€ëŠ¥í•˜ë‹¤.ì˜ˆë¥¼ ë“¤ë©´ border-width-bottom, borderWidthBottom ëª¨ë‘ ê°€ëŠ¥í•˜ë‹¤.</li>
			<li>float ì†ì„±ì€ JavaScriptì˜ ì˜ˆì•½ì–´ë¡œ ì‚¬ìš©ë˜ë¯€ë¡œ css() ë©”ì„œë“œì—ì„œëŠ” float ëŒ€ì‹  cssFloatì„ ì‚¬ìš©í•œë‹¤(Internet Explorerì—ì„œëŠ” styleFloat, ê·¸ ì™¸ì˜ ë¸Œë¼ìš°ì €ì—ì„œëŠ” cssFloatë¥¼ ì‚¬ìš©í•œë‹¤.).</li>
		</ul>
	@see nv.$Element#attr
	@example
		// CSS ì†ì„± ê°’ ì„¤ì •
		$Element('btn').css('backgroundColor', 'red');
		
		//Before
		<span id="btn"></span>
		
		//After
		<span id="btn" style="background-color: red;"></span>
	@example
		// ì—¬ëŸ¬ê°œì˜ CSS ì†ì„± ê°’ì„ ì„¤ì •
		$Element('btn').css({
			width: "200px",		// 200
			height: "80px"  	// 80 ìœ¼ë¡œ ì„¤ì •í•˜ì—¬ë„ ê²°ê³¼ëŠ” ê°™ìŒ
		});
		
		//Before
		<span id="btn" style="background-color: red;"></span>
		
		//After
		<span id="btn" style="background-color: red; width: 200px; height: 80px;"></span>
 */

/**
 	hook() ë©”ì„œë“œëŠ” CSSëª…ì„ ì¡°íšŒí•œë‹¤.
	@method hook
	@syntax vName
	@static
	@param {String+} vName CSSëª…(String)
	@remark 2.7.0ë¶€í„° ì‚¬ìš©ê°€ëŠ¥í•˜ë‹¤.
	@return {Variant} CSSë¥¼ ë‚˜íƒ€ë‚´ëŠ” ê°’ í˜¹ì€ í•¨ìˆ˜.
	@example
		$Element.hook("textShadow");
		//webkitTextShadow
 */

/**
 	hook() ë©”ì„œë“œëŠ” ê°œë°œìžê°€ CSSë¥¼ ë§Œë“¤ë©´ ì§„ë„ì—ì„œ í•´ë‹¹ CSSê°€ ë“¤ì–´ì™”ì„ ë•Œ ë³€ê²½í•˜ì—¬ ì‚¬ìš©í•œë‹¤.
	@method hook
	@syntax vName, vValue
	@syntax oList
	@static
	@param {String+} vName CSSëª…(String)
	@param {Variant} vValue ë³€ê²½í•  CSSëª…(String|Function)
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ CSS ëª…ê³¼ ê°’ì„ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@remark 2.7.0ë¶€í„° ì‚¬ìš©ê°€ëŠ¥í•˜ë‹¤.
	@return {$Element} $Element
	
	
	@example
		$Element.hook("textShadow","webkitTextShadow");
		
		$Element("some").css("textShadow");
		//ì´ë ‡ê²Œ í•˜ë©´ ì§„ë„ì—ì„œëŠ” webkitTextShadowì˜ ê°’ì„ ë°˜í™˜.
	@example
		//í•¨ìˆ˜ë„ í• ë‹¹í•  ìˆ˜ ìžˆë‹¤.
		$Element.hook("textShadow",function(){
			if(isIE&&version>10){
				return "MsTextShadow";
			}else if(isSafari){
				return "webkitTextShadow";
			}else{
				return "textShadow";
			}
		});
		
		$Element("some").css("textShadow");
		///IEì´ê³  ë²„ì „ì´ 10ì´ìƒì¸ ê²½ìš°ëŠ” MsTextShadowê°’ì„ ê°€ì ¸ì˜´
		//Safariì¸ ê²½ìš° webkitTextShadowê°’ìœ¼ë¡œ ê°€ì ¸ì˜´
 */

nv._p_._revisionCSSAttr = function(name,vendorPrefix){
    var custumName = nv.$Element.hook(name);
    if(custumName){
        name = custumName;
    }else{
        name = nv._p_.cssNameToJavaScriptName(name).replace(/^(animation|perspective|transform|transition)/i,function(_1){
            return vendorPrefix[_1.toLowerCase()];
        });
    }
    return name;
};

nv._p_.changeTransformValue = function(name,_test){
    return  (name+"").replace(/([\s|-]*)(?:transform)/,function(_,m1){ 
        return nv._p_.trim(m1).length > 0 ? _ : m1+nv._p_.getTransformStringForValue(_test);
    });
};

nv.$Element.prototype.css = function(sName, sValue) {
    //-@@$Element.css-@@//
    var oArgs = g_checkVarType(arguments, {
        'g'     : [ 'sName:String+'],
        's4str' : [ nv.$Jindo._F('sName:String+'), nv.$Jindo._F('vValue:String+') ],
        's4num' : [ 'sName:String+', 'vValue:Numeric' ],
        's4obj' : [ 'oObj:Hash+']
    },"$Element#css");
    
    var e = this._element;

    switch(oArgs+"") {
        case 's4str':
        case 's4num':
            var obj = {};
            sName = nv._p_._revisionCSSAttr(sName,nv._p_.getStyleIncludeVendorPrefix());
            obj[sName] = sValue;
            sName = obj;
            break;
        case 's4obj':
            sName = oArgs.oObj;
            var obj = {};
            var vendorPrefix = nv._p_.getStyleIncludeVendorPrefix();
            for (var i in sName) if (sName.hasOwnProperty(i)){
                obj[nv._p_._revisionCSSAttr(i,vendorPrefix)] = sName[i]; 
            }
            sName = obj;
            break;
        case 'g':
            var vendorPrefix = nv._p_.getStyleIncludeVendorPrefix();
            sName = nv._p_._revisionCSSAttr(sName,vendorPrefix);
            var _getCss = this._getCss;

            if(sName == "opacity"){
                return this.opacity();
            }
            if((nv._p_._JINDO_IS_FF||nv._p_._JINDO_IS_OP)&&(sName=="backgroundPositionX"||sName=="backgroundPositionY")){
                var bp = _getCss(e, "backgroundPosition").split(/\s+/);
                return (sName == "backgroundPositionX") ? bp[0] : bp[1];
            }
            if ((!window.getComputedStyle) && sName == "backgroundPosition") {
                return _getCss(e, "backgroundPositionX") + " " + _getCss(e, "backgroundPositionY");
            }
            if ((!nv._p_._JINDO_IS_OP && window.getComputedStyle) && (sName=="padding"||sName=="margin")) {
                var top     = _getCss(e, sName+"Top");
                var right   = _getCss(e, sName+"Right");
                var bottom  = _getCss(e, sName+"Bottom");
                var left    = _getCss(e, sName+"Left");
                if ((top == right) && (bottom == left)) {
                    return top;
                }else if (top == bottom) {
                    if (right == left) {
                        return top+" "+right;
                    }else{
                        return top+" "+right+" "+bottom+" "+left;
                    }
                }else{
                    return top+" "+right+" "+bottom+" "+left;
                }
            }
            return _getCss(e, sName);
            
    }
    var v, type;

    for(var k in sName) {
        if(sName.hasOwnProperty(k)){
            v    = sName[k];
            if (!(nv.$Jindo.isString(v)||nv.$Jindo.isNumeric(v))) continue;
            if (k == 'opacity') {
                this.opacity(v);
                continue;
            }
            if (k == "cssFloat" && nv._p_._JINDO_IS_IE) k = "styleFloat";
        
            if((nv._p_._JINDO_IS_FF||nv._p_._JINDO_IS_OP)&&( k =="backgroundPositionX" || k == "backgroundPositionY")){
                var bp = this.css("backgroundPosition").split(/\s+/);
                v = k == "backgroundPositionX" ? v+" "+bp[1] : bp[0]+" "+v;
                this._setCss(e, "backgroundPosition", v);
            }else{
                this._setCss(e, k, /transition/i.test(k) ? nv._p_.changeTransformValue(v):v);
            }
        }
    }
    
    return this;
};
//-!nv.$Element.prototype.css end!-//

//-!nv.$Element.prototype._getCss.hidden start!-//
/**
 	cssì—ì„œ ì‚¬ìš©ë˜ëŠ” í•¨ìˆ˜
	
	@method _getCss
	@ignore
	@param {Element} e
	@param {String} sName
 */
nv.$Element.prototype._getCss = function(e, sName){
    var fpGetCss;
    if (window.getComputedStyle) {
        fpGetCss = function(e, sName){
            try{
                if (sName == "cssFloat") sName = "float";
                var d = e.ownerDocument || e.document || document;
                var sVal = e.style[sName];
                if(!e.style[sName]){
                    var computedStyle = d.defaultView.getComputedStyle(e,null);
                    sName = sName.replace(/([A-Z])/g,"-$1").replace(/^(webkit|ms)/g,"-$1").toLowerCase();
                    sVal =  computedStyle.getPropertyValue(sName);
                    sVal =  sVal===undefined?computedStyle[sName]:sVal;
                }
                if (sName == "textDecoration") sVal = sVal.replace(",","");
                return sVal;
            }catch(ex){
                throw new nv.$Error((e.tagName||"document") + nv.$Except.NOT_USE_CSS,"$Element#css");
            }
        };
    
    }else if (e.currentStyle) {
        fpGetCss = function(e, sName){
            try{
                if (sName == "cssFloat") sName = "styleFloat";
                var sStyle = e.style[sName];
                if(sStyle){
                    return sStyle;
                }else{
                    var oCurrentStyle = e.currentStyle;
                    if (oCurrentStyle) {
                        return oCurrentStyle[sName];
                    }
                }
                return sStyle;
            }catch(ex){
                throw new nv.$Error((e.tagName||"document") + nv.$Except.NOT_USE_CSS,"$Element#css");
            }
        };
    } else {
        fpGetCss = function(e, sName){
            try{
                if (sName == "cssFloat" && nv._p_._JINDO_IS_IE) sName = "styleFloat";
                return e.style[sName];
            }catch(ex){
                throw new nv.$Error((e.tagName||"document") + nv.$Except.NOT_USE_CSS,"$Element#css");
            }
        };
    }
    nv.$Element.prototype._getCss = fpGetCss;
    return fpGetCss(e, sName);
    
};
//-!nv.$Element.prototype._getCss.hidden end!-//

//-!nv.$Element.prototype._setCss.hidden start!-//
/**
 	cssì—ì„œ cssë¥¼ ì„¸íŒ…í•˜ê¸° ìœ„í•œ í•¨ìˆ˜
	
	@method _setCss
	@ignore
	@param {Element} e
	@param {String} k
 */
nv.$Element.prototype._setCss = function(e, k, v){
    if (("#top#left#right#bottom#").indexOf(k+"#") > 0 && (typeof v == "number" ||(/\d$/.test(v)))) {
        e.style[k] = parseInt(v,10)+"px";
    }else{
        e.style[k] = v;
    }
};
//-!nv.$Element.prototype._setCss.hidden end!-//

//-!nv.$Element.prototype.attr start!-//
/**
 	attr() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ì†ì„±ì„ ê°€ì ¸ì˜¨ë‹¤. í•˜ë‚˜ì˜ íŒŒë¼ë¯¸í„°ë§Œ ì‚¬ìš©í•˜ë©´ ì§€ì •í•œ ì†ì„±ì˜ ê°’ì„ ë°˜í™˜í•˜ê³  í•´ë‹¹ ì†ì„±ì´ ì—†ë‹¤ë©´ nullì„ ë°˜í™˜í•œë‹¤.
	
	@method attr
	@param {String+} sName ì†ì„± ì´ë¦„(String)
	@return {String+} ì†ì„± ê°’ì„ ë°˜í™˜.
	@remark 2.2.0 ë²„ì „ ë¶€í„° &lt;select&gt; ì—˜ë¦¬ë¨¼íŠ¸ì— ì‚¬ìš©ì‹œ, ì˜µì…˜ê°’ì„ ê°€ì ¸ì˜¬ ìˆ˜ ìžˆë‹¤.
	@example
		<a href="http://www.naver.com" id="sample_a" target="_blank">Naver</a>
		
		$Element("sample_a").attr("href"); // http://www.naver.com
 */
/**
 	attr() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ì†ì„±ì„ ì„¤ì •í•œë‹¤. 
	
	@method attr
	@syntax sName, vValue
	@syntax oList
	@param {String+} sName ì†ì„± ì´ë¦„(String).
	@param {Variant} vValue ì†ì„±ì— ì„¤ì •í•  ê°’. ìˆ«ìž(Number) í˜¹ì€ ë‹¨ìœ„ë¥¼ í¬í•¨í•œ ë¬¸ìžì—´(String)ì„ ì‚¬ìš©í•œë‹¤. ë˜í•œ ì†ì„±ì˜ ê°’ì„ nullë¡œ ì„¤ì •í•˜ë©´ í•´ë‹¹ HTML ì†ì„±ì„ ì‚­ì œí•œë‹¤.
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ ì†ì„±ê³¼ ê°’ì„ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@return {this} ì†ì„± ê°’ì„ ë°˜ì˜í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@throws {nv.$Except.NOT_USE_CSS} sNameì€ ë¬¸ìž,ì˜¤ë¸Œì íŠ¸ ë‚˜ $Hashì—¬ì•¼ í•œë‹¤.
	@remark 2.2.0 ë²„ì „ ë¶€í„° &lt;select&gt; ì—˜ë¦¬ë¨¼íŠ¸ì— ì‚¬ìš©ì‹œ, ì˜µì…˜ê°’ì„ ì„¤ì •í•  ìˆ˜ ìžˆë‹¤.
	@see nv.$Element#css
	@example
		$Element("sample_a").attr("href", "http://www.hangame.com/");
		
		//Before
		<a href="http://www.naver.com" id="sample_a" target="_blank">Naver</a>
		
		//After
		<a href="http://www.hangame.com" id="sample_a" target="_blank">Naver</a>
	@example
		$Element("sample_a").attr({
		    "href" : "http://www.hangame.com",
		    "target" : "_self"
		})
		
		//Before
		<a href="http://www.naver.com" id="sample_a" target="_blank">Naver</a>
		
		//After
		<a href="http://www.hangame.com" id="sample_a" target="_self">Naver</a>
	@example
		<select id="select">
			<option value="naver">ë„¤ì´ë²„</option>
			<option value="hangame">í•œê²Œìž„</option>
			<option>ì¥¬ë‹ˆë²„</option>
		</select>
		<script type="text/javascript">
			var wel = $Element("select");
			wel.attr("value"); // "naver"
			wel.attr("value", null).attr("value"); // null
			wel.attr("value", "í•œê²Œìž„").attr("value"); // "hangame"
			wel.attr("value", "ì¥¬ë‹ˆë²„").attr("value"); // "ì¥¬ë‹ˆë²„"
			wel.attr("value", "naver").attr("value"); // "naver"
			wel.attr("value", ["hangame"]).attr("value"); // null
		</script>
	@example
		<select id="select" multiple="true">
			<option value="naver">ë„¤ì´ë²„</option>
			<option value="hangame">í•œê²Œìž„</option>
			<option>ì¥¬ë‹ˆë²„</option>
		</select>
		<script type="text/javascript">
			var wel = $Element("select");
			wel.attr("value"); // null
			wel.attr("value", "naver").attr("value"); // ["naver"]
			wel.attr("value", null).attr("value"); // null
			wel.attr("value", ["í•œê²Œìž„"]).attr("value"); // ["hangame"]
			wel.attr("value", []).attr("value"); // null
			wel.attr("value", ["ë„¤ì´ë²„", "hangame"]).attr("value"); // ["naver", "hangame"]
			wel.attr("value", ["ì¥¬ë‹ˆë²„", "me2day"]).attr("value"); // ["ì¥¬ë‹ˆë²„"]
			wel.attr("value", ["naver", "í•´í”¼ë¹ˆ"]).attr("value"); // ["naver"]
		</script>
 */
nv.$Element.prototype.attr = function(sName, sValue) {
    //-@@$Element.attr-@@//
    var oArgs = g_checkVarType(arguments, {
        'g'     : [ 'sName:String+'],
        's4str' : [ 'sName:String+', 'vValue:String+' ],
        's4num' : [ 'sName:String+', 'vValue:Numeric' ],
        's4nul' : [ 'sName:String+', 'vValue:Null' ],
        's4bln' : [ 'sName:String+', 'vValue:Boolean' ],
        's4arr' : [ 'sName:String+', 'vValue:Array+' ],
        's4obj' : [ nv.$Jindo._F('oObj:Hash+')]
    },"$Element#attr");
    
    var e = this._element,
        aValue = null,
        i,
        length,
        nIndex,
        fGetIndex,
        elOption,
        wa;
    
    switch(oArgs+""){
        case "s4str":
        case "s4nul":
        case "s4num":
        case "s4bln":
        case "s4arr":
            var obj = {};
            obj[sName] = sValue;
            sName = obj;
            break;
        case "s4obj":
            sName = oArgs.oObj;
            break;
        case "g":
            if (sName == "class" || sName == "className"){ 
                return e.className;
            }else if(sName == "style"){
                return e.style.cssText;
            }else if(sName == "checked"||sName == "disabled"){
                return !!e[sName];
            }else if(sName == "value"){
                if(this.tag == "button"){
                    return e.getAttributeNode('value').value;
                }else if(this.tag == "select"){
                    if(e.multiple){
                        for(i = 0, length = e.options.length; i < length; i++){
                            elOption = e.options[i];
                            
                            if(elOption.selected){
                                if(!aValue){
                                    aValue = [];
                                }
                                
                                sValue = elOption.value;
                                
                                if(sValue == ""){
                                    sValue = elOption.text;
                                }
                                
                                aValue.push(sValue);
                            }
                        }
                        return aValue;
                    }else{
                        if(e.selectedIndex < 0){
                            return null;
                        }
                        
                        sValue = e.options[e.selectedIndex].value;
                        return (sValue == "") ? e.options[e.selectedIndex].text : sValue;
                    }
                }else{
                    return e.value;
                }
            }else if(sName == "href"){
                return e.getAttribute(sName,2);
            }
            return e.getAttribute(sName);
    }
    
    fGetIndex = function(oOPtions, vValue){
        var nIndex = -1,
            i,
            length,
            elOption;
        
        for(i = 0, length = oOPtions.length; i < length; i++){
            elOption = oOPtions[i];
            if(elOption.value === vValue || elOption.text === vValue){
                nIndex = i;
                break;
            }
        }
        
        return nIndex;
    };

    for(var k in sName){
        if(sName.hasOwnProperty(k)){
            var v = sName[k];
            // when remove property
            if(nv.$Jindo.isNull(v)){
                if(this.tag == "select"){
                    if(e.multiple){
                        for(i = 0, length = e.options.length; i < length; i++){
                            e.options[i].selected = false;
                        }
                    }else{
                        e.selectedIndex = -1;
                    }
                }else{
                    e.removeAttribute(k);
                }
            }else{
                if(k == "class"|| k == "className"){
                    e.className = v;
                }else if(k == "style"){
                    e.style.cssText = v;
                }else if(k == "checked"||k == "disabled"){
                    e[k] = v;
                }else if(k == "value"){
                    if(this.tag == "select"){
                        if(e.multiple){
                            if(nv.$Jindo.isArray(v)){
                                wa = nv.$A(v);
                                for(i = 0, length = e.options.length; i < length; i++){
                                    elOption = e.options[i];
                                    elOption.selected = wa.has(elOption.value) || wa.has(elOption.text);
                                }
                            }else{
                                e.selectedIndex = fGetIndex(e.options, v);
                            }
                        }else{
                            e.selectedIndex = fGetIndex(e.options, v);
                        }
                    }else{
                        e.value = v;
                    }
                }else{
                    e.setAttribute(k, v);
                }
            } 
        }
    }

    return this;
};
//-!nv.$Element.prototype.attr end!-//

//-!nv.$Element.prototype.width start!-//
/**
 	width() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ì‹¤ì œ ë„ˆë¹„ë¥¼ ê°€ì ¸ì˜¨ë‹¤.
	
	@method width
	@return {Number} HTML ìš”ì†Œì˜ ì‹¤ì œ ë„ˆë¹„(Number)ë¥¼  ë°˜í™˜í•œë‹¤.
	@remark ë¸Œë¼ìš°ì €ë§ˆë‹¤ Box ëª¨ë¸ì˜ í¬ê¸° ê³„ì‚° ë°©ë²•ì´ ë‹¤ë¥´ë¯€ë¡œ CSSì˜ width ì†ì„± ê°’ê³¼ width ë©”ì„œë“œ()ì˜ ë°˜í™˜ ê°’ì€ ì„œë¡œ ë‹¤ë¥¼ ìˆ˜ ìžˆë‹¤.
	@see nv.$Element#height
	@example
		<style type="text/css">
			div { width:70px; height:50px; padding:5px; margin:5px; background:red; }
		</style>
		
		<div id="sample_div"></div>
		
		// ì¡°íšŒ
		$Element("sample_div").width();	// 80
 */
/**
 	width() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ë„ˆë¹„ë¥¼ ì„¤ì •í•œë‹¤.
	
	@method width
	@param {Numeric} nWidth	ì„¤ì •í•  ë„ˆë¹„ ê°’. ë‹¨ìœ„ëŠ” í”½ì…€(px)ì´ë©° íŒŒë¼ë¯¸í„°ì˜ ê°’ì€ ìˆ«ìžë¡œ ì§€ì •í•œë‹¤.
	@return {this} width ì†ì„± ê°’ì„ ë°˜ì˜í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark ë¸Œë¼ìš°ì €ë§ˆë‹¤ Box ëª¨ë¸ì˜ í¬ê¸° ê³„ì‚° ë°©ë²•ì´ ë‹¤ë¥´ë¯€ë¡œ CSSì˜ width ì†ì„± ê°’ê³¼ width ë©”ì„œë“œ()ì˜ ë°˜í™˜ ê°’ì€ ì„œë¡œ ë‹¤ë¥¼ ìˆ˜ ìžˆë‹¤.
	@see nv.$Element#height
	@example
		// HTML ìš”ì†Œì— ë„ˆë¹„ ê°’ì„ ì„¤ì •
		$Element("sample_div").width(200);
		
		//Before
		<style type="text/css">
			div { width:70px; height:50px; padding:5px; margin:5px; background:red; }
		</style>
		
		<div id="sample_div"></div>
		
		//After
		<div id="sample_div" style="width: 190px"></div>
 */
nv.$Element.prototype.width = function(width) {
    //-@@$Element.width-@@//
    var oArgs = g_checkVarType(arguments, {
        'g' : [  ],
        's' : ["nWidth:Numeric"]
    },"$Element#width");
    
    switch(oArgs+""){
        case "g" :
            
            return this._element.offsetWidth;
            
        case "s" :
            
            width = oArgs.nWidth;
            var e = this._element;
            e.style.width = width+"px";
            var off = e.offsetWidth;
            if (off != width && off!==0) {
                var w = (width*2 - off);
                if (w>0)
                    e.style.width = w + "px";
            }
            return this;
            
    }

};
//-!nv.$Element.prototype.width end!-//

//-!nv.$Element.prototype.height start!-//
/**
 	height() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ì‹¤ì œ ë†’ì´ë¥¼ ê°€ì ¸ì˜¨ë‹¤.
	
	@method height
	@return {Number} HTML ìš”ì†Œì˜ ì‹¤ì œ ë†’ì´(Number)ë¥¼ ë°˜í™˜í•œë‹¤.
	@remark ë¸Œë¼ìš°ì €ë§ˆë‹¤ Box ëª¨ë¸ì˜ í¬ê¸° ê³„ì‚° ë°©ë²•ì´ ë‹¤ë¥´ë¯€ë¡œ CSSì˜ height ì†ì„± ê°’ê³¼ height() ë©”ì„œë“œì˜ ë°˜í™˜ ê°’ì€ ì„œë¡œ ë‹¤ë¥¼ ìˆ˜ ìžˆë‹¤.
	@see nv.$Element#width
	@example
		<style type="text/css">
			div { width:70px; height:50px; padding:5px; margin:5px; background:red; }
		</style>
		
		<div id="sample_div"></div>
		
		// ì¡°íšŒ
		$Element("sample_div").height(); // 60
 */
/**
 	height() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ì‹¤ì œ ë†’ì´ë¥¼ ì„¤ì •í•œë‹¤.
	
	@method height
	@param {Number} nHeight ì„¤ì •í•  ë†’ì´ ê°’. ë‹¨ìœ„ëŠ” í”½ì…€(px)ì´ë©° íŒŒë¼ë¯¸í„°ì˜ ê°’ì€ ìˆ«ìžë¡œ ì§€ì •í•œë‹¤.
	@return {this} height ì†ì„± ê°’ì„ ë°˜ì˜í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark ë¸Œë¼ìš°ì €ë§ˆë‹¤ Box ëª¨ë¸ì˜ í¬ê¸° ê³„ì‚° ë°©ë²•ì´ ë‹¤ë¥´ë¯€ë¡œ CSSì˜ height ì†ì„± ê°’ê³¼ height() ë©”ì„œë“œì˜ ë°˜í™˜ ê°’ì€ ì„œë¡œ ë‹¤ë¥¼ ìˆ˜ ìžˆë‹¤.
	@see nv.$Element#width
	@example
		// HTML ìš”ì†Œì— ë†’ì´ ê°’ì„ ì„¤ì •
		$Element("sample_div").height(100);
		
		//Before
		<style type="text/css">
			div { width:70px; height:50px; padding:5px; margin:5px; background:red; }
		</style>
		
		<div id="sample_div"></div>
		
		//After
		<div id="sample_div" style="height: 90px"></div>
 */
nv.$Element.prototype.height = function(height) {
    //-@@$Element.height-@@//
    var oArgs = g_checkVarType(arguments, {
        'g' : [  ],
        's' : ["nHeight:Numeric"]
    },"$Element#height");
    
    switch(oArgs+""){
        case "g" :
            return this._element.offsetHeight;
            
        case "s" :
            height = oArgs.nHeight;
            var e = this._element;
            e.style.height = height+"px";
            var off = e.offsetHeight;
            if (off != height && off!==0) {
                var height = (height*2 - off);
                if(height>0)
                    e.style.height = height + "px";
            }
            return this;
            
    }
};
//-!nv.$Element.prototype.height end!-//

//-!nv.$Element.prototype.className start!-//
/**
 	className() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ í´ëž˜ìŠ¤ ì´ë¦„ì„ í™•ì¸í•œë‹¤.
	
	@method className
	@return {String} í´ëž˜ìŠ¤ ì´ë¦„ì„ ë°˜í™˜. í•˜ë‚˜ ì´ìƒì˜ í´ëž˜ìŠ¤ê°€ ì§€ì •ëœ ê²½ìš° ê³µë°±ìœ¼ë¡œ êµ¬ë¶„ëœ ë¬¸ìžì—´ì´ ë°˜í™˜ëœë‹¤.
	@see nv.$Element#hasClass
	@see nv.$Element#addClass
	@see nv.$Element#removeClass
	@see nv.$Element#toggleClass
	@example
		<style type="text/css">
		p { margin: 8px; font-size:16px; }
		.selected { color:#0077FF; }
		.highlight { background:#C6E746; }
		</style>
		
		<p>Hello and <span id="sample_span" class="selected">Goodbye</span></p>
		
		// í´ëž˜ìŠ¤ ì´ë¦„ ì¡°íšŒ
		$Element("sample_span").className(); // selected
 */
/**
 	className() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ í´ëž˜ìŠ¤ ì´ë¦„ì„ ì„¤ì •í•œë‹¤.
	
	@method className
	@param {String+} sClass ì„¤ì •í•  í´ëž˜ìŠ¤ ì´ë¦„. í•˜ë‚˜ ì´ìƒì˜ í´ëž˜ìŠ¤ë¥¼ ì§€ì •í•˜ë ¤ë©´ ê³µë°±ìœ¼ë¡œ êµ¬ë¶„í•˜ì—¬ ì§€ì •í•  í´ëž˜ìŠ¤ ì´ë¦„ì„ ë‚˜ì—´í•œë‹¤.
	@return {this} ì§€ì •í•œ í´ëž˜ìŠ¤ë¥¼ ë°˜ì˜í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@throws {nv.$Except.NOT_FOUND_ARGUMENT} íŒŒë¼ë¯¸í„°ê°€ ì—†ëŠ” ê²½ìš°.
	@see nv.$Element#hasClass
	@see nv.$Element#addClass
	@see nv.$Element#removeClass
	@see nv.$Element#toggleClass
	@example
		// HTML ìš”ì†Œì— í´ëž˜ìŠ¤ ì´ë¦„ ì„¤ì •
		$Element("sample_span").className("highlight");
		
		//Before
		<style type="text/css">
		p { margin: 8px; font-size:16px; }
		.selected { color:#0077FF; }
		.highlight { background:#C6E746; }
		</style>
		
		<p>Hello and <span id="sample_span" class="selected">Goodbye</span></p>
		
		//After
		<p>Hello and <span id="sample_span" class="highlight">Goodbye</span></p>
 */
nv.$Element.prototype.className = function(sClass) {
    //-@@$Element.className-@@//
    var oArgs = g_checkVarType(arguments, {
        'g' : [  ],
        's' : [nv.$Jindo._F("sClass:String+")]
    },"$Element#className");
    var e = this._element;
    switch(oArgs+"") {
        case "g":
            return e.className;
        case "s":
            e.className = sClass;
            return this;
            
    }

};
//-!nv.$Element.prototype.className end!-//

//-!nv.$Element.prototype.hasClass start!-//
/**
 	hasClass() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì—ì„œ íŠ¹ì • í´ëž˜ìŠ¤ë¥¼ ì‚¬ìš©í•˜ê³  ìžˆëŠ”ì§€ í™•ì¸í•œë‹¤.
	
	@method hasClass
	@param {String+} sClass í™•ì¸í•  í´ëž˜ìŠ¤ ì´ë¦„.
	@return {Boolean} ì§€ì •í•œ í´ëž˜ìŠ¤ì˜ ì‚¬ìš© ì—¬ë¶€.
	@see nv.$Element#className
	@see nv.$Element#addClass
	@see nv.$Element#removeClass
	@see nv.$Element#toggleClass
	@example
		<style type="text/css">
			p { margin: 8px; font-size:16px; }
			.selected { color:#0077FF; }
			.highlight { background:#C6E746; }
		</style>
		
		<p>Hello and <span id="sample_span" class="selected highlight">Goodbye</span></p>
		
		// í´ëž˜ìŠ¤ì˜ ì‚¬ìš©ì—¬ë¶€ë¥¼ í™•ì¸
		var welSample = $Element("sample_span");
		welSample.hasClass("selected"); 			// true
		welSample.hasClass("highlight"); 			// true
 */
nv.$Element.prototype.hasClass = function(sClass) {
    //-@@$Element.hasClass-@@//
    var ___checkVarType = g_checkVarType;

    if(nv._p_.canUseClassList()){
        nv.$Element.prototype.hasClass = function(sClass){
            var oArgs = ___checkVarType(arguments, {
                '4str' : ["sClass:String+"]
            },"$Element#hasClass");
            return this._element.classList.contains(sClass);
        };
    } else {
        nv.$Element.prototype.hasClass = function(sClass){
            var oArgs = ___checkVarType(arguments, {
                '4str' : ["sClass:String+"]
            },"$Element#hasClass");
            return (" "+this._element.className+" ").indexOf(" "+sClass+" ") > -1;
        };
    }
    return this.hasClass.apply(this,arguments);
};
//-!nv.$Element.prototype.hasClass end!-//

//-!nv.$Element.prototype.addClass start!-//
/**
 	addClass() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì— í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€í•œë‹¤.
	
	@method addClass
	@param {String+} sClass ì¶”ê°€í•  í´ëž˜ìŠ¤ ì´ë¦„. ë‘˜ ì´ìƒì˜ í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€í•˜ë ¤ë©´ í´ëž˜ìŠ¤ ì´ë¦„ì„ ê³µë°±ìœ¼ë¡œ êµ¬ë¶„í•˜ì—¬ ë‚˜ì—´í•œë‹¤.
	@return {this} ì§€ì •í•œ í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#className
	@see nv.$Element#hasClass
	@see nv.$Element#removeClass
	@see nv.$Element#toggleClass
	@example
		// í´ëž˜ìŠ¤ ì¶”ê°€
		$Element("sample_span1").addClass("selected");
		$Element("sample_span2").addClass("selected highlight");
		
		//Before
		<p>Hello and <span id="sample_span1">Goodbye</span></p>
		<p>Hello and <span id="sample_span2">Goodbye</span></p>
		
		//After
		<p>Hello and <span id="sample_span1" class="selected">Goodbye</span></p>
		<p>Hello and <span id="sample_span2" class="selected highlight">Goodbye</span></p>
 */
nv.$Element.prototype.addClass = function(sClass) {
    //-@@$Element.addClass-@@//
    if(this._element.classList){
        nv.$Element.prototype.addClass = function(sClass) {
            if(this._element==null) return this;
            var oArgs = g_checkVarType(arguments, {
                '4str' : ["sClass:String+"]
            },"$Element#addClass");
         
            var aClass = (sClass+"").split(/\s+/);
            var flistApi = this._element.classList;
            for(var i = aClass.length ; i-- ;) {
                aClass[i]!=""&&flistApi.add(aClass[i]);
            }
            return this;
        };
    } else {
        nv.$Element.prototype.addClass = function(sClass) {
            var oArgs = g_checkVarType(arguments, {
                '4str' : ["sClass:String+"]
            },"$Element#addClass");
            var e = this._element;
            var sClassName = e.className;
            var aClass = (sClass+"").split(" ");
            var sEachClass;
            for (var i = aClass.length - 1; i >= 0 ; i--){
                sEachClass = aClass[i];
                if ((" "+sClassName+" ").indexOf(" "+sEachClass+" ") == -1) {
                    sClassName = sClassName+" "+sEachClass;
                }
            }
            e.className = sClassName.replace(/\s+$/, "").replace(/^\s+/, "");
            return this;
        };
    }
    return this.addClass.apply(this,arguments);
};
//-!nv.$Element.prototype.addClass end!-//

//-!nv.$Element.prototype.removeClass start!-//
/**
 	removeClass() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì—ì„œ íŠ¹ì • í´ëž˜ìŠ¤ë¥¼ ì œê±°í•œë‹¤.
	
	@method removeClass
	@param {String+} sClass ì œê±°í•  í´ëž˜ìŠ¤ ì´ë¦„. ë‘˜ ì´ìƒì˜ í´ëž˜ìŠ¤ë¥¼ ì œê±°í•˜ë ¤ë©´ í´ëž˜ìŠ¤ ì´ë¦„ì„ ê³µë°±ìœ¼ë¡œ êµ¬ë¶„í•˜ì—¬ ë‚˜ì—´í•œë‹¤.
	@return {this} ì§€ì •í•œ í´ëž˜ìŠ¤ë¥¼ ì œê±°í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#className
	@see nv.$Element#hasClass
	@see nv.$Element#addClass
	@see nv.$Element#toggleClass
	@example
		// í´ëž˜ìŠ¤ ì œê±°
		$Element("sample_span").removeClass("selected");
		
		//Before
		<p>Hello and <span id="sample_span" class="selected highlight">Goodbye</span></p>
		
		//After
		<p>Hello and <span id="sample_span" class="highlight">Goodbye</span></p>
	@example
		// ì—¬ëŸ¬ê°œì˜ í´ëž˜ìŠ¤ë¥¼ ì œê±°
		$Element("sample_span").removeClass("selected highlight");
		$Element("sample_span").removeClass("highlight selected");
		
		//Before
		<p>Hello and <span id="sample_span" class="selected highlight">Goodbye</span></p>
		
		//After
		<p>Hello and <span id="sample_span" class="">Goodbye</span></p> 
 */
nv.$Element.prototype.removeClass = function(sClass) {
    //-@@$Element.removeClass-@@//
 	if(this._element.classList) {
        nv.$Element.prototype.removeClass = function(sClass){
            var oArgs = g_checkVarType(arguments, {
                '4str' : ["sClass:String+"]
            },"$Element#removeClass");
            if(this._element==null) return this;
            var flistApi = this._element.classList;
            var aClass = (sClass+"").split(" ");
            for(var i = aClass.length ; i-- ;){
                aClass[i]!=""&&flistApi.remove(aClass[i]);
            }
            return this;
        };
 	} else {
        nv.$Element.prototype.removeClass = function(sClass) {
            var oArgs = g_checkVarType(arguments, {
                '4str' : ["sClass:String+"]
            },"$Element#removeClass");
            var e = this._element;
            var sClassName = e.className;
            var aClass = (sClass+"").split(" ");
            var sEachClass;

            for (var i = aClass.length - 1; i >= 0; i--){
                if(/\W/g.test(aClass[i])) {
                     aClass[i] = aClass[i].replace(/(\W)/g,"\\$1");
                }

                sClassName = (" "+sClassName+" ").replace(new RegExp("\\s+"+ aClass[i] +"(?=\\s+)","g")," ");
            }
            
            e.className = sClassName.replace(/\s+$/, "").replace(/^\s+/, "");

            return this;
        };
 	}
	return this.removeClass.apply(this,arguments);
};
//-!nv.$Element.prototype.removeClass end!-//

//-!nv.$Element.prototype.toggleClass start(nv.$Element.prototype.addClass,nv.$Element.prototype.removeClass,nv.$Element.prototype.hasClass)!-//
/**
 	toggleClass() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì— íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ í´ëž˜ìŠ¤ê°€ ì´ë¯¸ ì ìš©ë˜ì–´ ìžˆìœ¼ë©´ ì œê±°í•˜ê³  ë§Œì•½ ì—†ìœ¼ë©´ ì¶”ê°€í•œë‹¤.<br>
	íŒŒë¼ë¯¸í„°ë¥¼ í•˜ë‚˜ë§Œ ìž…ë ¥í•  ê²½ìš° íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ í´ëž˜ìŠ¤ê°€ ì‚¬ìš©ë˜ê³  ìžˆìœ¼ë©´ ì œê±°í•˜ê³  ì‚¬ìš©ë˜ê³  ìžˆì§€ ì•Šìœ¼ë©´ ì¶”ê°€í•œë‹¤. ë§Œì•½ ë‘ ê°œì˜ íŒŒë¼ë¯¸í„°ë¥¼ ìž…ë ¥í•  ê²½ìš° ë‘ í´ëž˜ìŠ¤ ì¤‘ì—ì„œ ì‚¬ìš©í•˜ê³  ìžˆëŠ” ê²ƒì„ ì œê±°í•˜ê³  ë‚˜ë¨¸ì§€ í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€í•œë‹¤.
	
	@method toggleClass
	@param {String+} sClass ì¶”ê°€ í˜¹ì€ ì œê±°í•  í´ëž˜ìŠ¤ ì´ë¦„1.
	@param {String+} [sClass2] ì¶”ê°€ í˜¹ì€ ì œê±°í•  í´ëž˜ìŠ¤ ì´ë¦„2.
	@return {this} ì§€ì •í•œ í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€ í˜¹ì€ ì œê±°í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@import core.$Element[hasClass,addClass,removeClass]
	@see nv.$Element#className
	@see nv.$Element#hasClass
	@see nv.$Element#addClass
	@see nv.$Element#removeClass
	@example
		// íŒŒë¼ë¯¸í„°ê°€ í•˜ë‚˜ì¸ ê²½ìš°
		$Element("sample_span1").toggleClass("highlight");
		$Element("sample_span2").toggleClass("highlight");
		
		//Before
		<p>Hello and <span id="sample_span1" class="selected highlight">Goodbye</span></p>
		<p>Hello and <span id="sample_span2" class="selected">Goodbye</span></p>
		
		//After
		<p>Hello and <span id="sample_span1" class="selected">Goodbye</span></p>
		<p>Hello and <span id="sample_span2" class="selected highlight">Goodbye</span></p>
	@example
		// íŒŒë¼ë¯¸í„°ê°€ ë‘ ê°œì¸ ê²½ìš°
		$Element("sample_span1").toggleClass("selected", "highlight");
		$Element("sample_span2").toggleClass("selected", "highlight");
		
		//Before
		<p>Hello and <span id="sample_span1" class="highlight">Goodbye</span></p>
		<p>Hello and <span id="sample_span2" class="selected">Goodbye</span></p>
		
		//After
		<p>Hello and <span id="sample_span1" class="selected">Goodbye</span></p>
		<p>Hello and <span id="sample_span2" class="highlight">Goodbye</span></p> 
 */
nv.$Element.prototype.toggleClass = function(sClass, sClass2) {
    //-@@$Element.toggleClass-@@//
    var ___checkVarType = g_checkVarType;
    if(nv._p_.canUseClassList()){
        nv.$Element.prototype.toggleClass = function(sClass, sClass2){
            var oArgs = ___checkVarType(arguments, {
                '4str'  : ["sClass:String+"],
                '4str2' : ["sClass:String+", "sClass2:String+"]
            },"$Element#toggleClass");
            
            switch(oArgs+"") {
                case '4str':
                    this._element.classList.toggle(sClass+"");
                    break;
                case '4str2':
                    sClass = sClass+"";
                    sClass2 = sClass2+"";
                    if(this.hasClass(sClass)){
                        this.removeClass(sClass);
                        this.addClass(sClass2);
                    }else{
                        this.addClass(sClass);
                        this.removeClass(sClass2);
                    }
                    
            }
            return this;
        };
    } else {
        nv.$Element.prototype.toggleClass = function(sClass, sClass2){
            var oArgs = ___checkVarType(arguments, {
                '4str'  : ["sClass:String+"],
                '4str2' : ["sClass:String+", "sClass2:String+"]
            },"$Element#toggleClass");
            
            sClass2 = sClass2 || "";
            if (this.hasClass(sClass)) {
                this.removeClass(sClass);
                if (sClass2) this.addClass(sClass2);
            } else {
                this.addClass(sClass);
                if (sClass2) this.removeClass(sClass2);
            }

            return this;
        };
    }
    return this.toggleClass.apply(this,arguments);
};
//-!nv.$Element.prototype.toggleClass end!-//

//-!nv.$Element.prototype.cssClass start(nv.$Element.prototype.addClass,nv.$Element.prototype.removeClass,nv.$Element.prototype.hasClass)!-//
/**
 	cssClassëŠ” í´ëž˜ìŠ¤ì˜ ìœ ë¬´ë¥¼ í™•ì¸í•œë‹¤.
	
	@method cssClass
	@param {String+} sName classëª…
	@return {Boolean} í•´ë‹¹ í´ëž˜ìŠ¤ê°€ ìžˆëŠ”ì§€ ì—¬ë¶€ì˜ ë¶ˆë¦° ê°’ì„ ë°˜í™˜í•œë‹¤.
	@since 2.0.0
	@see nv.$Element#addClass
	@see nv.$Element#removeClass
	@example
		// ì²« ë²ˆì§¸ íŒŒë¼ë¯¸í„°ë§Œ ë„£ì€ ê²½ìš°
		<div id="sample_span1"/>
		$Element("sample_span1").cssClass("highlight");// false
 */
/**
 	cssClassëŠ” í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€, ì‚­ì œí•  ìˆ˜ ìžˆë‹¤.
	
	@method cssClass
	@syntax sName, bClassType
	@syntax oList
	@param {String+} sName classëª…,
	@param {Boolean} bClassType trueì¸ ê²½ìš°ëŠ” í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€í•˜ê³  falseì¸ ê²½ìš°ëŠ” í´ëž˜ìŠ¤ë¥¼ ì‚­ì œí•œë‹¤.
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ ì†ì„±ëª…ê³¼ ë¶ˆë¦°ê°’ì„ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@return {this} ì§€ì •í•œ í´ëž˜ìŠ¤ë¥¼ ì¶”ê°€/ì‚­ì œí•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@since 2.0.0
	@see nv.$Element#addClass
	@see nv.$Element#removeClass
	@example
		// ë‘ ë²ˆì§¸ íŒŒë¼ë¯¸í„°ë„ ë„£ì€ ê²½ìš°.
		$Element("sample_span1").cssClass("highlight",true);
		-> <div id="sample_span1" class="highlight"/>
		
		$Element("sample_span1").cssClass("highlight",false);
		-> <div id="sample_span1" class=""/>
	@example
		// ì²« ë²ˆì§¸ íŒŒë¼ë¯¸í„°ë¥¼ ì˜¤ë¸Œì íŠ¸ë¡œ ë„£ì€ ê²½ìš°.
		<div id="sample_span1" class="bar"/>
		
		$Element("sample_span1").cssClass({
			"foo": true,
			"bar" : false
		});
		-> <div id="sample_span1" class="foo"/>
 */
nv.$Element.prototype.cssClass = function(vClass, bCondition){
    var oArgs = g_checkVarType(arguments, {
        'g'  : ["sClass:String+"],
        's4bln' : ["sClass:String+", "bCondition:Boolean"],
        's4obj' : ["oObj:Hash+"]
    },"$Element#cssClass");
            
    switch(oArgs+""){
        case "g":
            return this.hasClass(oArgs.sClass);
            
        case "s4bln":
            if(oArgs.bCondition){
                this.addClass(oArgs.sClass);
            }else{
                this.removeClass(oArgs.sClass);
            }
            return this;
            
        case "s4obj":
            var e = this._element;
            vClass = oArgs.oObj;
            var sClassName = e.className;
            for(var sEachClass in vClass){
                if (vClass.hasOwnProperty(sEachClass)) {
                    if(vClass[sEachClass]){
                        if ((" " + sClassName + " ").indexOf(" " + sEachClass + " ") == -1) {
                            sClassName = (sClassName+" "+sEachClass).replace(/^\s+/, "");
                        }
                    }else{
                        if ((" " + sClassName + " ").indexOf(" " + sEachClass + " ") > -1) {
                            sClassName = (" "+sClassName+" ").replace(" "+sEachClass+" ", " ").replace(/\s+$/, "").replace(/^\s+/, "");
                        }
                    }
                }
            }
            e.className = sClassName;
            return this;
            
    }


};  
    
//-!nv.$Element.prototype.cssClass end!-//
//-!nv.$Element.prototype.text start!-//
/**
 	text() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ í…ìŠ¤íŠ¸ ë…¸ë“œ ê°’ì„ ê°€ì ¸ì˜¨ë‹¤.
	
	@method text
	@return {String} HTML ìš”ì†Œì˜ í…ìŠ¤íŠ¸ ë…¸ë“œ(String)ë¥¼ ë°˜í™˜.
	@example
		<ul id="sample_ul">
			<li>í•˜ë‚˜</li>
			<li>ë‘˜</li>
			<li>ì…‹</li>
			<li>ë„·</li>
		</ul>
		
		// í…ìŠ¤íŠ¸ ë…¸ë“œ ê°’ ì¡°íšŒ
		$Element("sample_ul").text();
		// ê²°ê³¼
		//	í•˜ë‚˜
		//	ë‘˜
		//	ì…‹
		//	ë„·
 */
/**
 	text() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ í…ìŠ¤íŠ¸ ë…¸ë“œë¥¼ ì§€ì •í•œ ê°’ìœ¼ë¡œ ì„¤ì •í•œë‹¤.
	
	@method text
	@param {String+} sText ì§€ì •í•  í…ìŠ¤íŠ¸.
	@return {this} ì§€ì •í•œ ê°’ì„ ì„¤ì •í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		// í…ìŠ¤íŠ¸ ë…¸ë“œ ê°’ ì„¤ì •
		$Element("sample_ul").text('ë‹¤ì„¯');
		
		//Before
		<ul id="sample_ul">
			<li>í•˜ë‚˜</li>
			<li>ë‘˜</li>
			<li>ì…‹</li>
			<li>ë„·</li>
		</ul>
		
		//After
		<ul id="sample_ul">ë‹¤ì„¯</ul>
	@example
		// í…ìŠ¤íŠ¸ ë…¸ë“œ ê°’ ì„¤ì •
		$Element("sample_p").text("New Content");
		
		//Before
		<p id="sample_p">
			Old Content
		</p>
		
		//After
		<p id="sample_p">
			New Content
		</p>
 */
nv.$Element.prototype.text = function(sText) {
    //-@@$Element.text-@@//
    var oArgs = g_checkVarType(arguments, {
        'g'  : [],
        's4str' : ["sText:String+"],
        's4num' : [nv.$Jindo._F("sText:Numeric")],
        's4bln' : ["sText:Boolean"]
    },"$Element#text"),
        ele = this._element,
        tag = this.tag,
        prop,
        oDoc;
    
    switch(oArgs+""){
        case "g":
            prop = (ele.textContent !== undefined) ? "textContent" : "innerText";
            
            if(tag == "textarea" || tag == "input"){
                prop = "value";
            }
            
            return ele[prop];
        case "s4str":
        case "s4num":
        case "s4bln":
            try{
                /*
                  * Opera 11.01ì—ì„œ textContextê°€ Getì¼ë•Œ ì •ìƒì ìœ¼ë¡œ ë™ìž‘í•˜ì§€ ì•ŠìŒ. ê·¸ëž˜ì„œ getì¼ ë•ŒëŠ” innerTextì„ ì‚¬ìš©í•˜ê³  setí•˜ëŠ” ê²½ìš°ëŠ” textContentì„ ì‚¬ìš©í•œë‹¤.(http://devcafe.nhncorp.com/ajaxui/295768)
                 */ 
                if (tag == "textarea" || tag == "input"){
                    ele.value = sText + "";
                }else{
                    var oDoc = ele.ownerDocument || ele.document || document;
                    this.empty();
                    ele.appendChild(oDoc.createTextNode(sText));
                }
            }catch(e){
                return ele.innerHTML = (sText + "").replace(/&/g, '&amp;').replace(/</g, '&lt;');
            }
            
            return this;
    }
};
//-!nv.$Element.prototype.text end!-//

//-!nv.$Element.prototype.html start!-//
/**
 	html() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ë‚´ë¶€ HTML ì½”ë“œ(innerHTML)ë¥¼ ê°€ì ¸ì˜¨ë‹¤.
	
	@method html
	@return {String} ë‚´ë¶€ HTML(String)ì„ ë°˜í™˜. 
	@see https://developer.mozilla.org/en/DOM/element.innerHTML element.innerHTML - MDN Docs
	@see nv.$Element#outerHTML
	@example
		<div id="sample_container">
			<p><em>Old</em> content</p>
		</div>
		
		// ë‚´ë¶€ HTML ì¡°íšŒ
		$Element("sample_container").html(); // <p><em>Old</em> content</p>
 */
/**
 	html() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ë‚´ë¶€ HTML ì½”ë“œ(innerHTML)ë¥¼ ì„¤ì •í•œë‹¤. ì´ë•Œ ëª¨ë“  í•˜ìœ„ ìš”ì†Œì˜ ëª¨ë“  ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ë¥¼ ì œê±°í•œë‹¤.
	
	@method html
	@param {String+} sHTML ë‚´ë¶€ HTML ì½”ë“œë¡œ ì„¤ì •í•  HTML ë¬¸ìžì—´.
	@return {this} ì§€ì •í•œ ê°’ì„ ì„¤ì •í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark IE8ì—ì„œ colgroupì˜ colì„ ìˆ˜ì •í•˜ë ¤ê³  í•  ë•Œ colgroupì„ ì‚­ì œí•˜ê³  ë‹¤ì‹œ ë§Œë“  í›„ colì„ ì¶”ê°€í•´ì•¼ í•©ë‹ˆë‹¤.
	@see https://developer.mozilla.org/en/DOM/element.innerHTML element.innerHTML - MDN Docs
	@see nv.$Element#outerHTML
	@example
		// ë‚´ë¶€ HTML ì„¤ì •
		$Element("sample_container").html("<p>New <em>content</em></p>");
		
		//Before
		<div id="sample_container">
		 	<p><em>Old</em> content</p>
		</div>
		
		//After
		<div id="sample_container">
		 	<p>New <em>content</em></p>
		</div>
 */
nv.$Element.prototype.html = function(sHTML) {
    //-@@$Element.html-@@//
    var isIe = nv._p_._JINDO_IS_IE;
    var isFF = nv._p_._JINDO_IS_FF;
    var _param = {
                'g'  : [],
                's4str' : [nv.$Jindo._F("sText:String+")],
                's4num' : ["sText:Numeric"],
                's4bln' : ["sText:Boolean"]
    };
    var ___checkVarType = g_checkVarType;
    
    if (isIe) {
        nv.$Element.prototype.html = function(sHTML){
            var oArgs = ___checkVarType(arguments,_param,"$Element#html");
            switch(oArgs+""){
                case "g":
                    return this._element.innerHTML;
                case "s4str":
                case "s4num":
                case "s4bln":
                    sHTML += "";
                    if(nv.cssquery) nv.cssquery.release();
                    var oEl = this._element;
    
                    while(oEl.firstChild){
                        oEl.removeChild(oEl.firstChild);
                    }
                    /*
                      * IE ë‚˜ FireFox ì˜ ì¼ë¶€ ìƒí™©ì—ì„œ SELECT íƒœê·¸ë‚˜ TABLE, TR, THEAD, TBODY íƒœê·¸ì— innerHTML ì„ ì…‹íŒ…í•´ë„
 * ë¬¸ì œê°€ ìƒê¸°ì§€ ì•Šë„ë¡ ë³´ì™„ - hooriza
                     */
                    var sId = 'R' + new Date().getTime() + parseInt(Math.random() * 100000,10);
                    var oDoc = oEl.ownerDocument || oEl.document || document;
    
                    var oDummy;
                    var sTag = oEl.tagName.toLowerCase();
    
                    switch (sTag) {
                        case 'select':
                        case 'table':
                            oDummy = oDoc.createElement("div");
                            oDummy.innerHTML = '<' + sTag + ' class="' + sId + '">' + sHTML + '</' + sTag + '>';
                            break;
                        case 'tr':
                        case 'thead':
                        case 'tbody':
                        case 'colgroup':
                            oDummy = oDoc.createElement("div");
                            oDummy.innerHTML = '<table><' + sTag + ' class="' + sId + '">' + sHTML + '</' + sTag + '></table>';
                            break;
        
                        default:
                            oEl.innerHTML = sHTML;
                            
                    }
    
                    if (oDummy) {
    
                        var oFound;
                        for (oFound = oDummy.firstChild; oFound; oFound = oFound.firstChild)
                            if (oFound.className == sId) break;
    
                        if (oFound) {
                            var notYetSelected = true;
                            for (var oChild; oChild = oEl.firstChild;) oChild.removeNode(true); // innerHTML = '';
    
                            for (var oChild = oFound.firstChild; oChild; oChild = oFound.firstChild){
                                if(sTag=='select'){
                                    /*
                                     * ieì—ì„œ selectí…Œê·¸ì¼ ê²½ìš° optionì¤‘ selectedê°€ ë˜ì–´ ìžˆëŠ” optionì´ ìžˆëŠ” ê²½ìš° ì¤‘ê°„ì—
* selectedê°€ ë˜ì–´ ìžˆìœ¼ë©´ ê·¸ ë‹¤ìŒ ë¶€í„°ëŠ” ê³„ì† selectedê°€ trueë¡œ ë˜ì–´ ìžˆì–´
* í•´ê²°í•˜ê¸° ìœ„í•´ cloneNodeë¥¼ ì´ìš©í•˜ì—¬ optionì„ ì¹´í”¼í•œ í›„ selectedë¥¼ ë³€ê²½í•¨. - mixed
                                     */
                                    var cloneNode = oChild.cloneNode(true);
                                    if (oChild.selected && notYetSelected) {
                                        notYetSelected = false;
                                        cloneNode.selected = true;
                                    }
                                    oEl.appendChild(cloneNode);
                                    oChild.removeNode(true);
                                }else{
                                    oEl.appendChild(oChild);
                                }
    
                            }
                            oDummy.removeNode && oDummy.removeNode(true);
    
                        }
    
                        oDummy = null;
    
                    }
    
                    return this;
                    
            }
        };
    }else if(isFF){
        nv.$Element.prototype.html = function(sHTML){
            var oArgs = ___checkVarType(arguments,_param,"$Element#html");
            
            switch(oArgs+""){
                case "g":
                    return this._element.innerHTML;
                    
                case "s4str":
                case "s4num":
                case "s4bln":
                	// nv._p_.releaseEventHandlerForAllChildren(this);
                	
                    sHTML += ""; 
                    var oEl = this._element;
                    
                    if(!oEl.parentNode){
                        /*
                         {{html_1}}
                         */
                        var sId = 'R' + new Date().getTime() + parseInt(Math.random() * 100000,10);
                        var oDoc = oEl.ownerDocument || oEl.document || document;
    
                        var oDummy;
                        var sTag = oEl.tagName.toLowerCase();
    
                        switch (sTag) {
                        case 'select':
                        case 'table':
                            oDummy = oDoc.createElement("div");
                            oDummy.innerHTML = '<' + sTag + ' class="' + sId + '">' + sHTML + '</' + sTag + '>';
                            break;
    
                        case 'tr':
                        case 'thead':
                        case 'tbody':
                        case 'colgroup':
                            oDummy = oDoc.createElement("div");
                            oDummy.innerHTML = '<table><' + sTag + ' class="' + sId + '">' + sHTML + '</' + sTag + '></table>';
                            break;
    
                        default:
                            oEl.innerHTML = sHTML;
                            
                        }
    
                        if (oDummy) {
                            var oFound;
                            for (oFound = oDummy.firstChild; oFound; oFound = oFound.firstChild)
                                if (oFound.className == sId) break;
    
                            if (oFound) {
                                for (var oChild; oChild = oEl.firstChild;) oChild.removeNode(true); // innerHTML = '';
    
                                for (var oChild = oFound.firstChild; oChild; oChild = oFound.firstChild){
                                    oEl.appendChild(oChild);
                                }
    
                                oDummy.removeNode && oDummy.removeNode(true);
    
                            }
    
                            oDummy = null;
    
                        }
                    }else{
                        oEl.innerHTML = sHTML;
                    }
                    
    
                    return this;
                    
            }
        };
    }else{
        nv.$Element.prototype.html = function(sHTML){
            var oArgs = ___checkVarType(arguments,_param,"$Element#html");
            
            switch(oArgs+""){
                case "g":
                    return this._element.innerHTML;
                    
                case "s4str":
                case "s4num":
                case "s4bln":
                	// nv._p_.releaseEventHandlerForAllChildren(this);
                	
                    sHTML += ""; 
                    var oEl = this._element;
                    oEl.innerHTML = sHTML;
                    return this;
                    
            }
            
        };
    }
    
    return this.html.apply(this,arguments);
};
//-!nv.$Element.prototype.html end!-//

//-!nv.$Element.prototype.outerHTML start!-//
/**
 	outerHTML() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ë‚´ë¶€ ì½”ë“œ(innerHTML)ì— í•´ë‹¹í•˜ëŠ” ë¶€ë¶„ê³¼ ìžì‹ ì˜ íƒœê·¸ë¥¼ í¬í•¨í•œ HTML ì½”ë“œë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method outerHTML
	@return {String} HTML ì½”ë“œ.
	@see nv.$Element#html
	@example
		<h2 id="sample0">Today is...</h2>
		
		<div id="sample1">
		  	<p><span id="sample2">Sample</span> content</p>
		</div>
		
		// ì™¸ë¶€ HTML ê°’ì„ ì¡°íšŒ
		$Element("sample0").outerHTML(); // <h2 id="sample0">Today is...</h2>
		$Element("sample1").outerHTML(); // <div id="sample1">  <p><span id="sample2">Sample</span> content</p>  </div>
		$Element("sample2").outerHTML(); // <span id="sample2">Sample</span>
 */
nv.$Element.prototype.outerHTML = function() {
    //-@@$Element.outerHTML-@@//
    var e = this._element;
    e = nv.$Jindo.isDocument(e)?e.documentElement:e;
    if (e.outerHTML !== undefined) return e.outerHTML;
    
    var oDoc = e.ownerDocument || e.document || document;
    var div = oDoc.createElement("div");
    var par = e.parentNode;

    /**
            ìƒìœ„ë…¸ë“œê°€ ì—†ìœ¼ë©´ innerHTMLë°˜í™˜
     */
    if(!par) return e.innerHTML;

    par.insertBefore(div, e);
    div.style.display = "none";
    div.appendChild(e);

    var s = div.innerHTML;
    par.insertBefore(e, div);
    par.removeChild(div);

    return s;
};
//-!nv.$Element.prototype.outerHTML end!-//

//-!nv.$Element.prototype.toString start(nv.$Element.prototype.outerHTML)!-//
/**
 	toString() ë©”ì„œë“œëŠ” í•´ë‹¹ ìš”ì†Œì˜ ì½”ë“œë¥¼ ë¬¸ìžì—´ë¡œ ë³€í™˜í•˜ì—¬ ë°˜í™˜í•œë‹¤(outerHTML ë©”ì„œë“œì™€ ë™ì¼).
	
	@method toString
	@return {String} HTML ì½”ë“œ.
	@see nv.$Element#outerHTML
 */
nv.$Element.prototype.toString = function(){
    return this.outerHTML()||"[object $Element]";
};
//-!nv.$Element.prototype.toString end!-//

//-!nv.$Element.prototype.attach start(nv.$Element.prototype.isEqual,nv.$Element.prototype.isChildOf,nv.$Element.prototype.detach, nv.$Element.event_etc, nv.$Element.domready, nv.$Element.unload, nv.$Event)!-//
/**
 	attach() ë©”ì„œë“œëŠ” ì—˜ë¦¬ë¨¼íŠ¸ì— ì´ë²¤íŠ¸ë¥¼ í• ë‹¹í•œë‹¤.
	@syntax sEvent, fpCallback
	@syntax oList
	@method attach
	@param {String+} sEvent ì´ë²¤íŠ¸ ëª…
		<ul class="disc">
			<li>ì´ë²¤íŠ¸ ì´ë¦„ì—ëŠ” on ì ‘ë‘ì–´ë¥¼ ì‚¬ìš©í•˜ì§€ ì•ŠëŠ”ë‹¤.</li>
			<li>ë§ˆìš°ìŠ¤ íœ  ìŠ¤í¬ë¡¤ ì´ë²¤íŠ¸ëŠ” mousewheel ë¡œ ì‚¬ìš©í•œë‹¤.</li>
			<li>ê¸°ë³¸ ì´ë²¤íŠ¸ ì™¸ì— ì¶”ê°€ë¡œ ì‚¬ìš©ì´ ê°€ëŠ¥í•œ ì´ë²¤íŠ¸ë¡œ domready, mouseenter, mouseleave, mousewheelì´ ìžˆë‹¤.</li>
			<li>delegateì˜ ê¸°ëŠ¥ì´ ì¶”ê°€ë¨ (@ì„ êµ¬ë¶„ìžë¡œ selectorì„ ê°™ì´ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.)</li>
		</ul>
	@param {Function+} fpCallback ì´ë²¤íŠ¸ê°€ ë°œìƒí–ˆì„ ë•Œ ì‹¤í–‰ë˜ëŠ” ì½œë°±í•¨ìˆ˜.
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ ì´ë²¤íŠ¸ëª…ê³¼ í•¨ìˆ˜ë¥¼ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@return {this} ì´ë²¤íŠ¸ë¥¼ í• ë‹¹í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@throws {nv.$Except.NOT_WORK_DOMREADY} IEì¸ ê²½ìš° í”„ë ˆìž„ ì•ˆì—ì„œëŠ” domreadyí•¨ìˆ˜ë¥¼ ì‚¬ìš©í•  ë•Œ.
	@since 2.0.0
	@remark 2.2.0 ë²„ì „ë¶€í„°, loadì™€ domreadyì´ë²¤íŠ¸ëŠ” ê°ê° Windowì™€ Documentì—ì„œ ë°œìƒí•˜ëŠ” ì´ë²¤íŠ¸ì´ì§€ë§Œ ì„œë¡œë¥¼ êµì°¨í•´ì„œ ë“±ë¡í•˜ì—¬ë„ ì´ë²¤íŠ¸ê°€ ì˜¬ë°”ë¥´ê²Œ ë°œìƒí•œë‹¤.
	@remark 2.5.0 ë²„ì „ë¶€í„° @ì„ êµ¬ë¶„ìžë¡œ delegateì²˜ëŸ¼ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	@see nv.$Element#detach
	@see nv.$Element#delegate
	@see nv.$Element#undelegate
	@example
		function normalEvent(e){
			alert("click");
		}
		function groupEvent(e){
			alert("group click");
		}
		
		//ì¼ë°˜ì ì¸ ì´ë²¤íŠ¸ í• ë‹¹.
		$Element("some_id").attach("click",normalEvent);
	@example
		function normalEvent(e){
			alert("click");
		}
		
		//delegateì²˜ëŸ¼ ì‚¬ìš©í•˜ê¸° ìœ„í•´ì„œëŠ” @ì„ êµ¬ë¶„ìžë¡œ ì‚¬ìš©ê°€ëŠ¥.
		$Element("some_id").attach("click@.selected",normalEvent);
		
		
		$Element("some_id").attach({
			"click@.selected":normalEvent,
			"click@.checked":normalEvent2,
			"click@.something":normalEvent3
		});
	@example
		function loadHandler(e){
			// empty
		}
		function domreadyHandler(e){
			// empty
		}
		var welDoc = $Element(document);
		var welWin = $Element(window);
		
		// documentì— load ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ ë“±ë¡
		welDoc.attach("load", loadHandler);
		welDoc.hasEventListener("load"); // true
		welWin.hasEventListener("load"); // true
		
		// detachëŠ” document, window ì–´ëŠê²ƒì—ì„œ í•´ë„ ìƒê´€ì—†ë‹¤.
		welDoc.detach("load", loadHandler);
		welDoc.hasEventListener("load"); // false
		welWin.hasEventListener("load"); // false
		
		// windowì— domready ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ ë“±ï¿½ï¿½ï¿½
		welWin.attach("domready", domreadyHandler);
		welWin.hasEventListener("domready"); // true
		welDoc.hasEventListener("domready"); // true
		
		// detachëŠ” document, window ì–´ëŠê²ƒì—ì„œ í•´ë„ ìƒê´€ì—†ë‹¤.
		welWin.detach("domready", domreadyHandler);
		welWin.hasEventListener("domready"); // false
		welDoc.hasEventListener("domready"); // false
 */   
nv.$Element.prototype.attach = function(sEvent, fpCallback){
    var oArgs = g_checkVarType(arguments, {
        '4str'  : ["sEvent:String+", "fpCallback:Function+"],
        '4obj'  : ["hListener:Hash+"]
    },"$Element#attach"), oSplit, hListener;
   
    switch(oArgs+""){
       case "4str":
            oSplit = nv._p_.splitEventSelector(oArgs.sEvent);
            this._add(oSplit.type,oSplit.event,oSplit.selector,fpCallback);
            break;
       case "4obj":
            hListener = oArgs.hListener;
            for(var i in hListener){
                this.attach(i,hListener[i]);
            }
            break;
    }
    return this;
};
//-!nv.$Element.prototype.attach end!-//

//-!nv.$Element.prototype.detach start(nv.$Element.prototype.attach)!-//
/**
 	detach() ë©”ì„œë“œëŠ” ì—˜ë¦¬ë¨¼íŠ¸ì— ë“±ë¡ëœ ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ë¥¼ ë“±ë¡ í•´ì œí•œë‹¤.
	@syntax sEvent, fpCallback
	@syntax oList
	@method detach
	@param {String+} sEvent ì´ë²¤íŠ¸ ëª…
	@param {Function+} fpCallback ì´ë²¤íŠ¸ê°€ ë°œìƒí–ˆì„ ë•Œ ì‹¤í–‰ë˜ëŠ” ì½œë°±í•¨ìˆ˜.
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ ì´ë²¤íŠ¸ëª…ê³¼ í•¨ìˆ˜ë¥¼ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@return {this} ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ë¥¼ ë“±ë¡ í•´ì œí•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 2.2.0 ë²„ì „ë¶€í„°, loadì™€ domreadyì´ë²¤íŠ¸ëŠ” ê°ê° Windowì™€ Documentì—ì„œ ë°œìƒí•˜ëŠ” ì´ë²¤íŠ¸ì´ì§€ë§Œ ì„œë¡œë¥¼ êµì°¨í•´ì„œ ë“±ë¡í•˜ì—¬ë„ ì´ë²¤íŠ¸ê°€ ì˜¬ë°”ë¥´ê²Œ ë°œìƒí•œë‹¤.
	@remark 2.5.0 ë²„ì „ë¶€í„° @ì„ êµ¬ë¶„ìžë¡œ delegateì²˜ëŸ¼ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.
	@see nv.$Element#detach
	@see nv.$Element#delegate
	@see nv.$Element#undelegate
	@since 2.0.0
	@example
		function normalEvent(e){
			alert("click");
		}
		function groupEvent(e){
			alert("group click");
		}
		function groupEvent2(e){
			alert("group2 click");
		}
		function groupEvent3(e){
			alert("group3 click");
		}
		
		//ì¼ë°˜ì ì¸ ì´ë²¤íŠ¸ í• ë‹¹.
		$Element("some_id").attach("click",normalEvent);
		
		//ì¼ë°˜ì ì¸ ì´ë²¤íŠ¸ í•´ì œ. ì¼ë°˜ì ì¸ ì´ë²¤íŠ¸ í•´ì œëŠ” ë°˜ë“œì‹œ í•¨ìˆ˜ë¥¼ ë„£ì–´ì•¼ì§€ë§Œ í•´ì œê°€ ê°€ëŠ¥í•˜ë‹¤.
		$Element("some_id").detach("click",normalEvent);
   @example
		function normalEvent(e){
			alert("click");
		}
		
		//undelegateì²˜ëŸ¼ ì‚¬ìš©í•˜ê¸° ìœ„í•´ì„œëŠ” @ì„ êµ¬ë¶„ìžë¡œ ì‚¬ìš©ê°€ëŠ¥.
		$Element("some_id").attach("click@.selected",normalEvent);
		$Element("some_id").detach("click@.selected",normalEvent);
 */
nv.$Element.prototype.detach = function(sEvent, fpCallback){
    var oArgs = g_checkVarType(arguments, {
        // 'group_for_string'  : ["sEvent:String+"],
        '4str'  : ["sEvent:String+", "fpCallback:Function+"],
        '4obj'  : ["hListener:Hash+"]
    },"$Element#detach"), oSplit, hListener;
   
    switch(oArgs+""){
       case "4str":
            oSplit = nv._p_.splitEventSelector(oArgs.sEvent);
            this._del(oSplit.type,oSplit.event,oSplit.selector,fpCallback);
            break;
       case "4obj":
            hListener = oArgs.hListener;
            for(var i in hListener){
                this.detach(i,hListener[i]);
            }
            break;
    }
    return this;
};
//-!nv.$Element.prototype.detach end!-//

//-!nv.$Element.prototype.delegate start(nv.$Element.prototype.undelegate, nv.$Element.event_etc, nv.$Element.domready, nv.$Element.unload, nv.$Event)!-//
/**
	delegate() ë©”ì„œë“œëŠ” ì´ë²¤íŠ¸ ìœ„ìž„(Event Deligation) ë°©ì‹ìœ¼ë¡œ ì´ë²¤íŠ¸ë¥¼ ì²˜ë¦¬í•œë‹¤.<br>
	ì´ë²¤íŠ¸ ìœ„ìž„ì´ëž€, ì´ë²¤íŠ¸ ë²„ë¸”ë§ì„ ì´ìš©í•˜ì—¬ ì´ë²¤íŠ¸ë¥¼ ê´€ë¦¬í•˜ëŠ” ìƒìœ„ ìš”ì†Œë¥¼ ë”°ë¡œ ë‘ì–´ íš¨ìœ¨ì ìœ¼ë¡œ ì´ë²¤íŠ¸ë¥¼ ê´€ë¦¬í•˜ëŠ” ë°©ë²•ì´ë‹¤.
	
	@method delegate
	@param {String+} sEvent ì´ë²¤íŠ¸ ì´ë¦„. on ì ‘ë‘ì–´ëŠ” ìƒëžµí•œë‹¤.
	@param {Variant} vFilter íŠ¹ì • HTML ìš”ì†Œì— ëŒ€í•´ì„œë§Œ ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ë¥¼ ì‹¤í–‰í•˜ë„ë¡ í•˜ê¸° ìœ„í•œ í•„í„°.<br>
	í•„í„°ëŠ” CSS ì„ íƒìž(String)ì™€ í•¨ìˆ˜(Function)ìœ¼ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
		<ul class="disc">
			<li>ë¬¸ìžì—´ì„ ìž…ë ¥í•˜ë©´ CSS ì„ íƒìžë¡œ ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ë¥¼ ì‹¤í–‰ì‹œí‚¬ ìš”ì†Œë¥¼ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.</li>
			<li>Boolean ê°’ì„ ë°˜í™˜í•˜ëŠ” í•¨ìˆ˜ë¥¼ íŒŒë¼ë¯¸í„° ìž…ë ¥í•  ìˆ˜ ìžˆë‹¤. ì´ í•¨ìˆ˜ë¥¼ ì‚¬ìš©í•  ê²½ìš° í•¨ìˆ˜ê°€ trueë¥¼ ë°˜í™˜í•  ë•Œ ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜(fCallback)ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì¶”ê°€ ì§€ì •í•´ì•¼ í•œë‹¤.</li>
		</ul>
	@param {Function+} [fCallback] vFilterì— ì§€ì •ëœ í•¨ìˆ˜ê°€ trueë¥¼ ë°˜í™˜í•˜ëŠ” ê²½ìš° ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜.
	@return {this} ì´ë²¤íŠ¸ ìœ„ìž„ì„ ì ìš©í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 2.0.0ë¶€í„°  domready, mousewheel, mouseleave, mouseenter ì´ë²¤íŠ¸ ì‚¬ìš©ê°€ëŠ¥.
	@since 1.4.6
	@see nv.$Element#attach
	@see nv.$Element#detach
	@see nv.$Element#undelegate
	@example
		<ul id="parent">
			<li class="odd">1</li>
			<li>2</li>
			<li class="odd">3</li>
			<li>4</li>
		</ul>
	
		// CSS ì…€ë ‰í„°ë¥¼ í•„í„°ë¡œ ì‚¬ìš©í•˜ëŠ” ê²½ìš°
		$Element("parent").delegate("click",
			".odd", 			// í•„í„°
			function(eEvent){	// ì½œë°± í•¨ìˆ˜
				alert("odd í´ëž˜ìŠ¤ë¥¼ ê°€ì§„ liê°€ í´ë¦­ ë  ë•Œ ì‹¤í–‰");
			});
	@example
		<ul id="parent">
			<li class="odd">1</li>
			<li>2</li>
			<li class="odd">3</li>
			<li>4</li>
		</ul>
	
		// í•¨ìˆ˜ë¥¼ í•„í„°ë¡œ ì‚¬ìš©í•˜ëŠ” ê²½ìš°
		$Element("parent").delegate("click",
			function(oEle,oClickEle){	// í•„í„°
				return oClickEle.innerHTML == "2"
			},
			function(eEvent){			// ì½œë°± í•¨ìˆ˜
				alert("í´ë¦­í•œ ìš”ì†Œì˜ innerHTMLì´ 2ì¸ ê²½ìš°ì— ì‹¤í–‰");
			});
*/
nv.$Element.prototype.delegate = function(sEvent , vFilter , fpCallback){
    var oArgs = g_checkVarType(arguments, {
        '4str'  : ["sEvent:String+", "vFilter:String+", "fpCallback:Function+"],
        '4fun'  : ["sEvent:String+", "vFilter:Function+", "fpCallback:Function+"]
    },"$Element#delegate");
    return this._add("delegate",sEvent,vFilter,fpCallback);
};
//-!nv.$Element.prototype.delegate end!-//

//-!nv.$Element.prototype.undelegate start(nv.$Element.prototype.delegate)!-//
/**
	undelegate() ë©”ì„œë“œëŠ” delegate() ë©”ì„œë“œë¡œ ë“±ë¡í•œ ì´ë²¤íŠ¸ ìœ„ìž„ì„ í•´ì œí•œë‹¤.
	
	@method undelegate
	@param {String+} sEvent ì´ë²¤íŠ¸ ìœ„ìž„ì„ ë“±ë¡í•  ë•Œ ì‚¬ìš©í•œ ì´ë²¤íŠ¸ ì´ë¦„. on ì ‘ë‘ì–´ëŠ” ìƒëžµí•œë‹¤.
	@param {Variant} [vFilter] ì´ë²¤íŠ¸ ìœ„ìž„ì„ ë“±ë¡í•  ë•Œ ì§€ì •í•œ í•„í„°. íŒŒë¼ë¯¸í„°ë¥¼ ìž…ë ¥í•˜ì§€ ì•Šìœ¼ë©´ ì—˜ë¦¬ë¨¼íŠ¸ì— delegateë¡œ í• ë‹¹í•œ ì´ë²¤íŠ¸ ì¤‘ íŠ¹ì • ì´ë²¤íŠ¸ì˜ ëª¨ë“  ì¡°ê±´ì´ ì‚¬ë¼ì§„ë‹¤.
	@param {Function+} [fCallback] ì´ë²¤íŠ¸ ìœ„ìž„ì„ ë“±ë¡í•  ë•Œ ì§€ì •í•œ ì½œë°± í•¨ìˆ˜.
	@return {this} ì´ë²¤íŠ¸ ìœ„ìž„ì„ í•´ì œí•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@since 1.4.6
	@see nv.$Element#attach
	@see nv.$Element#detach
	@see nv.$Element#delegate
	@example
		<ul id="parent">
			<li class="odd">1</li>
			<li>2</li>
			<li class="odd">3</li>
			<li>4</li>
		</ul>
		
		// ì½œë°± í•¨ìˆ˜
		function fnOddClass(eEvent){
			alert("odd í´ëž˜ìŠ¤ë¥¼ ê°€ì§„ liê°€ í´ë¦­ ë  ë•Œ ì‹¤í–‰");
		};
		function fnOddClass2(eEvent){
			alert("odd í´ëž˜ìŠ¤ë¥¼ ê°€ì§„ liê°€ í´ë¦­ ë  ë•Œ ì‹¤í–‰2");
		};
		function fnOddClass3(eEvent){
			alert("odd í´ëž˜ìŠ¤ë¥¼ ê°€ì§„ liê°€ í´ë¦­ ë  ë•Œ ì‹¤í–‰3");
		};
		
		// ì´ë²¤íŠ¸ ë¸ë¦¬ê²Œì´ì…˜ ì‚¬ìš©
		$Element("parent").delegate("click", ".odd", fnOddClass);
		
		// fnOddClassë§Œ ì´ë²¤íŠ¸ í•´ì œ
		$Element("parent").undelegate("click", ".odd", fnOddClass);
 */
nv.$Element.prototype.undelegate = function(sEvent , vFilter , fpCallback){
    var oArgs = g_checkVarType(arguments, {
        '4str'  : ["sEvent:String+", "vFilter:String+", "fpCallback:Function+"],
        '4fun'  : ["sEvent:String+", "vFilter:Function+", "fpCallback:Function+"],
        'group_for_string'  : ["sEvent:String+", "vFilter:String+"],
        'group_for_function'  : ["sEvent:String+", "vFilter:Function+"]
    },"$Element#undelegate");
    return this._del("delegate",sEvent,vFilter,fpCallback);
};
//-!nv.$Element.prototype.undelegate end!-//

//-!nv.$Element.event_etc.hidden start!-//
nv._p_.customEventAttach = function(sType,sEvent,vFilter,fpCallback,fpCallbackBind,eEle,fpAdd){
    if(!nv._p_.hasCustomEventListener(eEle.__nv__id,sEvent,vFilter)) {
        var CustomEvent = nv._p_.getCustomEvent(sEvent);
        var customInstance = new CustomEvent();
        var events = customInstance.events;
        
        customInstance.real_listener.push(fpCallback);
        customInstance.wrap_listener.push(fpCallbackBind);
        
        for(var i = 0, l = events.length ; i < l ; i++){
            customInstance["_fp"+events[i]] = nv.$Fn(customInstance[events[i]],customInstance).bind();
            fpAdd(sType, events[i], vFilter, customInstance["_fp"+events[i]]);
        }
        nv._p_.addCustomEventListener(eEle,eEle.__nv__id,sEvent,vFilter,customInstance);
    } else {
        var customInstance = nv._p_.getCustomEventListener(eEle.__nv__id, sEvent, vFilter).custom;
        if(customInstance.real_listener){
            customInstance.real_listener.push(fpCallback);
            customInstance.wrap_listener.push(fpCallbackBind);
        }
    }
};

nv._p_.normalCustomEventAttach = function(ele,sEvent,nv_id,vFilter,fpCallback,fpCallbackBind){
    if(!nv._p_.normalCustomEvent[sEvent][nv_id]){
        nv._p_.normalCustomEvent[sEvent][nv_id] = {};
        nv._p_.normalCustomEvent[sEvent][nv_id].ele = ele;
        nv._p_.normalCustomEvent[sEvent][nv_id][vFilter] = {};
        nv._p_.normalCustomEvent[sEvent][nv_id][vFilter].real_listener = [];
        nv._p_.normalCustomEvent[sEvent][nv_id][vFilter].wrap_listener = [];
    }
    nv._p_.normalCustomEvent[sEvent][nv_id][vFilter].real_listener.push(fpCallback);
    nv._p_.normalCustomEvent[sEvent][nv_id][vFilter].wrap_listener.push(fpCallbackBind);
};

/**
	ì´ë²¤íŠ¸ë¥¼ ì¶”ê°€í•˜ëŠ” ë‚´ë¶€ í•¨ìˆ˜.
	
	@method _add
	@ignore
	@param {String} sType delegateì¸ì§€ ì¼ë°˜ ì´ë²¤íŠ¸ì¸ì§€ í™•ì¸.
	@param {String} sEvent ì´ë²¤íŠ¸ëª….
	@param {String | Function} vFilter í•„í„° í•¨ìˆ˜.
	@param {Function} fpCallback ì´ë²¤íŠ¸ ì½œë°±í•¨ìˆ˜.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
 */

nv.$Element.prototype._add = function(sType, sEvent , vFilter , fpCallback){
    var oManager = nv.$Element.eventManager;
    var realEvent = sEvent;
    sEvent = sEvent.toLowerCase();
    var oEvent = oManager.splitGroup(sEvent);
    sEvent = oEvent.event;
    var sGroup = oEvent.group;
    var ele = this._element;
    var nv_id = ele.__nv__id;
    var oDoc = ele.ownerDocument || ele.document || document;
    
    if(nv._p_.hasCustomEvent(sEvent)){
        vFilter = vFilter||"_NONE_";
        var fpCallbackBind = nv.$Fn(fpCallback,this).bind();
        nv._p_.normalCustomEventAttach(ele,sEvent,nv_id,vFilter,fpCallback,fpCallbackBind);
        if(nv._p_.getCustomEvent(sEvent)){
            nv._p_.customEventAttach(sType, sEvent,vFilter,fpCallback,fpCallbackBind,ele,nv.$Fn(this._add,this).bind());
        }
    }else{
        if(sEvent == "domready" && nv.$Jindo.isWindow(ele)){
            nv.$Element(oDoc).attach(sEvent, fpCallback);
            return this;
        }
        
        if(sEvent == "load" && ele === oDoc){
            nv.$Element(window).attach(sEvent, fpCallback);
            return this;
        }
        
        if((!document.addEventListener)&&("domready"==sEvent)){
            if(window.top != window) throw  nv.$Error(nv.$Except.NOT_WORK_DOMREADY,"$Element#attach");
            nv.$Element._domready(ele, fpCallback);
            return this;
        }
        
        sEvent = oManager.revisionEvent(sType, sEvent,realEvent);
        fpCallback = oManager.revisionCallback(sType, sEvent, realEvent, fpCallback);
        
        if(!oManager.isInit(this._key)){
            oManager.init(this._key, ele);
        }
        
        if(!oManager.hasEvent(this._key, sEvent,realEvent)){
            oManager.initEvent(this, sEvent,realEvent,sGroup);
        }
        
        if(!oManager.hasGroup(this._key, sEvent, sGroup)){
            oManager.initGroup(this._key, sEvent, sGroup);
        }
        
        oManager.addEventListener(this._key, sEvent, sGroup, sType, vFilter, fpCallback);
    }
    

    return this;
};

nv._p_.customEventDetach = function(sType,sEvent,vFilter,fpCallback,eEle,fpDel) {
    var customObj = nv._p_.getCustomEventListener(eEle.__nv__id, sEvent, vFilter);
    var customInstance = customObj.custom;
    var events = customInstance.events;

    for(var i = 0, l = events.length; i < l; i++) {
        fpDel(sType, events[i], vFilter, customInstance["_fp"+events[i]]);
    }
};

/**
	ì´ë²¤íŠ¸ë¥¼ ì‚­ì œí•  ë•Œ ì‚¬ìš©í•˜ëŠ” ë‚´ë¶€ í•¨ìˆ˜.
	
	@method _del
	@ignore
	@param {String} sType ì´ë²¤íŠ¸ delegateì¸ì§€ ì¼ë°˜ ì´ë²¤íŠ¸ì¸ì§€ í™•ì¸.
	@param {String} sEvent ì´ë²¤íŠ¸ëª….
	@param {String|Function} vFilter í•„í„° í•¨ìˆ˜.
	@param {Function} fpCallback ì´ë²¤íŠ¸ ì½œë°±í•¨ìˆ˜.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
 */
nv.$Element.prototype._del = function(sType, sEvent, vFilter, fpCallback){
    var oManager = nv.$Element.eventManager;
    var realEvent = sEvent;
    sEvent = sEvent.toLowerCase();
    var oEvent = oManager.splitGroup(sEvent);
    sEvent = oEvent.event;
    var sGroup = oEvent.group;
    var oDoc = this._element.ownerDocument || this._element.document || document;
    if(nv._p_.hasCustomEvent(sEvent)){
        var nv_id = this._element.__nv__id;
        vFilter = vFilter||"_NONE_";
        
        var oNormal = nv._p_.getNormalEventListener(nv_id, sEvent, vFilter);
        
        
        
        var aWrap = oNormal.wrap_listener;
        var aReal = oNormal.real_listener;
        var aNewWrap = [];
        var aNewReal = [];
        
        for(var i = 0, l = aReal.length; i < l; i++){
            if(aReal[i]!=fpCallback){
                aNewWrap.push(aWrap[i]);
                aNewReal.push(aReal[i]);
            }
        }
        
        if(aNewReal.length==0){
            var oNormalJindo = nv._p_.normalCustomEvent[sEvent][nv_id];
            var count = 0;
            for(var i in oNormalJindo){
                if(i!=="ele"){
                    count++;
                    break;
                }
            }
            if(count === 0){
                delete nv._p_.normalCustomEvent[sEvent][nv_id];
            }else{
                delete nv._p_.normalCustomEvent[sEvent][nv_id][vFilter];
            }
        }
        
        if(nv._p_.customEvent[sEvent]){
            // var customInstance = nv._p_.getCustomEventListener(nv__id, sEvent, vFilter).custom;
//             
            // var aWrap = customInstance.wrap_listener;
            // var aReal = customInstance.real_listener;
            // var aNewWrap = [];
            // var aNewReal = [];
//             
            // for(var i = 0, l = aReal.length; i < l; i++){
                // if(aReal[i]!=fpCallback){
                    // aNewWrap.push(aWrap[i]);
                    // aNewReal.push(aReal[i]);
                // }
            // }
            nv._p_.setCustomEventListener(nv_id, sEvent, vFilter, aNewReal, aNewWrap);
            if(aNewReal.length==0){
                nv._p_.customEventDetach(sType, sEvent,vFilter,fpCallback,this._element,nv.$Fn(this._del,this).bind());
                delete nv._p_.customEventStore[nv_id][sEvent][vFilter];
            }
        }
        
    }else{
        if(sEvent == "domready" && nv.$Jindo.isWindow(this._element)){
            nv.$Element(oDoc).detach(sEvent, fpCallback);
            return this;
        }
        
        if(sEvent == "load" && this._element === oDoc){
            nv.$Element(window).detach(sEvent, fpCallback);
            return this;
        }
        
        sEvent = oManager.revisionEvent(sType, sEvent,realEvent);
        
        if((!document.addEventListener)&&("domready"==sEvent)){
            var aNewDomReady = [];
            var list = nv.$Element._domready.list;
            for(var i=0,l=list.length; i < l ;i++){
                if(list[i]!=fpCallback){
                    aNewDomReady.push(list[i]);
                }   
            }
            nv.$Element._domready.list = aNewDomReady;
            return this;
        }
        // if(sGroup === nv._p_.NONE_GROUP && !nv.$Jindo.isFunction(fpCallback)){
        if(sGroup === nv._p_.NONE_GROUP && !nv.$Jindo.isFunction(fpCallback)&&!vFilter){
            throw new nv.$Error(nv.$Except.HAS_FUNCTION_FOR_GROUP,"$Element#"+(sType=="normal"?"detach":"delegate"));
        }
    
        oManager.removeEventListener(this._key, sEvent, sGroup, sType, vFilter, fpCallback);
    }
    
    return this;
};

/**
	$Elementì˜ ì´ë²¤íŠ¸ë¥¼ ê´€ë¦¬í•˜ëŠ” ê°ì²´.
	
	@ignore
 */
nv._p_.mouseTouchPointerEvent = function (sEvent){
    var eventMap = {};

    if(window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 0) {
        eventMap = {
            "mousedown":"MSPointerDown",
            "mouseup":"MSPointerUp",
            "mousemove":"MSPointerMove",
            "mouseover":"MSPointerOver",
            "mouseout":"MSPointerOut",
            "touchstart":"MSPointerDown",
            "touchend":"MSPointerUp",
            "touchmove":"MSPointerMove",
            "pointerdown":"MSPointerDown",
            "pointerup":"MSPointerUp",
            "pointermove":"MSPointerMove",
            "pointerover":"MSPointerOver",
            "pointerout":"MSPointerOut",
            "pointercancel":"MSPointerCancel"
        };
    } else if(nv._p_._JINDO_IS_MO) {
        eventMap = {
            "mousedown":"touchstart",
            "mouseup":"touchend",
            "mousemove":"touchmove",
            "pointerdown":"touchstart",
            "pointerup":"touchend",
            "pointermove":"touchmove"
        };
    }

    nv._p_.mouseTouchPointerEvent = function(sEvent) {
        return eventMap[sEvent]?eventMap[sEvent]:sEvent;    
    };
    
    return nv._p_.mouseTouchPointerEvent(sEvent);
};

nv.$Element.eventManager = (function() {
    var eventStore = {};

    function bind(fpFunc, oScope, aPram) {
        return function() {
            var args = nv._p_._toArray( arguments, 0);
            if (aPram.length) args = aPram.concat(args);
            return fpFunc.apply(oScope, args);
        };
    }

    return {
        /**
        	mouseenterë‚˜ mouseleave ì´ë²¤íŠ¸ê°€ ì—†ëŠ” ë¸Œë¼ìš°ì €ì—ì„œ ì´ë²¤íŠ¸ë¥¼ í• ë‹¹ í•  ë•Œ ë™ìž‘í•˜ê²Œë” ì½œë°±í•¨ìˆ˜ë¥¼ ì¡°ì •í•˜ëŠ” í•¨ìˆ˜.<br>
	IEì—ì„œ delegateì— mouseenterë‚˜ mouseleaveì„ ì‚¬ìš©í•  ë•Œë„ ì‚¬ìš©. 
	
	@method revisionCallback
	@ignore
	@param {String} sType ì´ë²¤íŠ¸ delegateì¸ì§€ ì¼ë°˜ ì´ë²¤íŠ¸ì¸ì§€ í™•ì¸.
	@param {String} sEvent ì´ë²¤íŠ¸ëª…
	@param {Function} fpCallback ì´ë²¤íŠ¸ ì½œë°±í•¨ìˆ˜
         */
        revisionCallback : function(sType, sEvent, realEvent, fpCallback){
            if((document.addEventListener||nv._p_._JINDO_IS_IE&&(sType=="delegate"))&&(realEvent=="mouseenter"||realEvent=="mouseleave")) 
            // ||(nv._p_._JINDO_IS_IE&&(sType=="delegate")&&(realEvent=="mouseenter"||realEvent=="mouseleave")))
               {
                var fpWrapCallback = nv.$Element.eventManager._fireWhenElementBoundary(sType, fpCallback);
                fpWrapCallback._origin_ = fpCallback;
                fpCallback = fpWrapCallback;
            }
            return fpCallback;
        },
        /**
        	mouseenterë‚˜ mouseleave ì´ë²¤íŠ¸ê°€ ì—†ëŠ” ë¸Œë¼ìš°ì €ì—ì„œ ì—ë®¬ë ˆì´ì…˜í•´ì£¼ëŠ” í•¨ìˆ˜.
	
	@method _fireWhenElementBoundary
	@ignore
	@param {String} sType ì´ë²¤íŠ¸ delegateì¸ì§€ ì¼ë°˜ ì´ë²¤íŠ¸ì¸ì§€ í™•ì¸.
	@param {Function} fpCallback ì´ë²¤íŠ¸ ì½œë°±í•¨ìˆ˜
         */
        _fireWhenElementBoundary : function(sType, fpCallback){
            return function(oEvent) {
                var woRelatedElement = oEvent.relatedElement?nv.$Element(oEvent.relatedElement):null;
                var eElement = oEvent.currentElement;
                if(sType == "delegate"){
                    eElement = oEvent.element;
                }
                if(woRelatedElement && (woRelatedElement.isEqual(eElement) || woRelatedElement.isChildOf(eElement))) return;
                
                fpCallback(oEvent);
            };
        },
        /**
        	ë¸Œë¼ìš°ì €ë§ˆë‹¤ ì°¨ì´ìžˆëŠ” ì´ë²¤íŠ¸ ëª…ì„ ë³´ì •í•˜ëŠ” í•¨ìˆ˜.
	
	@method revisionEvent
	@ignore
	@param {String} sType ì´ë²¤íŠ¸ delegateì¸ì§€ ì¼ë°˜ ì´ë²¤íŠ¸ì¸ì§€ í™•ì¸.
	@param {String} sEvent ì´ë²¤íŠ¸ëª…
         */
        revisionEvent : function(sType, sEvent, realEvent){
            if (document.addEventListener !== undefined) {
                this.revisionEvent = function(sType, sEvent, realEvent){

                    // In IE distinguish upper and lower case and if prefix is 'ms' return as well.
                    if(/^ms/i.test(realEvent)){
                        return realEvent;
                    }
                    var customEvent = nv.$Event.hook(sEvent);

                    if(customEvent){
                        if(nv.$Jindo.isFunction(customEvent)){
                            return customEvent(); 
                        }else{
                            return customEvent;
                        }
                    }

                    sEvent = sEvent.toLowerCase();

                    if (sEvent == "domready" || sEvent == "domcontentloaded") {
                        sEvent = "DOMContentLoaded";
                    }else if (sEvent == "mousewheel" && !nv._p_._JINDO_IS_WK && !nv._p_._JINDO_IS_OP && !nv._p_._JINDO_IS_IE) {
                        /*
                          * IE9ì¸ ê²½ìš°ë„ DOMMouseScrollì´ ë™ìž‘í•˜ì§€ ì•ŠìŒ.
                         */
                        sEvent = "DOMMouseScroll";  
                    }else if (sEvent == "mouseenter" && (!nv._p_._JINDO_IS_IE||sType=="delegate")){
                        sEvent = "mouseover";
                    }else if (sEvent == "mouseleave" && (!nv._p_._JINDO_IS_IE||sType=="delegate")){
                        sEvent = "mouseout";
                    }else if(sEvent == "transitionend"||sEvent == "transitionstart"){
                        var sPostfix = sEvent.replace("transition","");
                        var info = nv._p_.getStyleIncludeVendorPrefix();

                        if(info.transition != "transition"){
                            sPostfix = sPostfix.substr(0,1).toUpperCase() + sPostfix.substr(1);
                        }

                        sEvent = info.transition + sPostfix;
                    }else if(sEvent == "animationstart"||sEvent == "animationend"||sEvent == "animationiteration"){
                        var sPostfix = sEvent.replace("animation","");
                        var info = nv._p_.getStyleIncludeVendorPrefix();

                        if(info.animation != "animation"){
                            sPostfix = sPostfix.substr(0,1).toUpperCase() + sPostfix.substr(1);
                        }

                        sEvent = info.animation + sPostfix;
                    }else if(sEvent === "focusin"||sEvent === "focusout"){
                        sEvent = sEvent === "focusin" ? "focus":"blur";

                    /*
                     * IEì—ì„œ 9ì™€ ì´í•˜ ë²„ì „ì—ì„œëŠ” oninput ì´ë²¤íŠ¸ì— ëŒ€í•œ fallbackì´ í•„ìš”. IE9ì˜ ê²½ìš°, oninput ì´ë²¤íŠ¸ ì§€ì›í•˜ë‚˜ input ìš”ì†Œì— ë‚´ìš©ì„ backspace í‚¤ ë“±ìœ¼ë¡œ ì‚­ì œì‹œ ë°”ë¡œ ë°˜ì˜ë˜ì§€ ì•ŠëŠ” ë²„ê·¸ê°€ ìžˆìŒ.
    ë”°ë¼ì„œ oninput ì´ë²¤íŠ¸ëŠ” ë‹¤ìŒê³¼ ê°™ì´ ë°”ì¸ë”© ë˜ë„ë¡ ë³€ê²½ë¨. - IE9: keyup, IE9 ì´í•˜ ë²„ì „: propertychange
                     */
                    } else if(sEvent == "input" && nv._p_._JINDO_IS_IE && document.documentMode <= 9) {
                        sEvent = "keyup";
                    }
                    return nv._p_.mouseTouchPointerEvent(sEvent);
                };
            }else{
                this.revisionEvent = function(sType, sEvent,realEvent){
                    // In IE distinguish upper and lower case and if prefix is 'ms' return as well.
                    if(/^ms/i.test(realEvent)){
                        return realEvent;
                    }
                    var customEvent = nv.$Event.hook(sEvent);
                    if(customEvent){
                        if(nv.$Jindo.isFunction(customEvent)){
                            return customEvent(); 
                        }else{
                            return customEvent;
                        }
                    }
                    /*
                     * IEì—ì„œ delegateì— mouseenterë‚˜ mouseleaveì„ ì‚¬ìš©í•  ë•ŒëŠ” mouseoverë‚˜ mouseleaveì„ ì´ìš©í•˜ì—¬ ì—ë®¬ë ˆì´ì…˜ í•˜ë„ë¡ ìˆ˜ì •í•´ì•¼ í•¨.
                     */
                    if(sType=="delegate"&&sEvent == "mouseenter") {
                        sEvent = "mouseover";
                    }else if(sType=="delegate"&&sEvent == "mouseleave") {
                        sEvent = "mouseout";
                    } else if(sEvent == "input") {
                        sEvent = "propertychange";
                    }

                    return nv._p_.mouseTouchPointerEvent(sEvent);
                };
            }
            return this.revisionEvent(sType, sEvent,realEvent);
        },
        /**
        			í…ŒìŠ¤íŠ¸ë¥¼ ìœ„í•œ í•¨ìˆ˜.
			
			@method test
			@ignore
         */
        test : function(){
            return eventStore;
        },
        /**
        			í‚¤ì— í•´ë‹¹í•˜ëŠ” í•¨ìˆ˜ê°€ ì´ˆê¸°í™” ë˜ì—ˆëŠ”ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
			
			@method isInit
			@ignore
			@param {String} sKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ê°’
         */
        isInit : function(sKey){
            return !!eventStore[sKey];
        },
        /**
        			ì´ˆê¸°í™” í•˜ëŠ” í•¨ìˆ˜.
			
			@method init
			@ignore
			@param {String} sKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ê°’
			@param {Element} eEle ì—˜ë¦¬ë¨¼íŠ¸
         */
        init : function(sKey, eEle){
            eventStore[sKey] = {
                "ele" : eEle,
                "event" : {}
            };
        },
        /**
        			í‚¤ê°’ì˜ í•´ë‹¹í•˜ëŠ” ì •ë³´ë¥¼ ë°˜í™˜.
			
			@method getEventConfig
			@ignore
			@param {String} sKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ê°’
         */
        getEventConfig : function(sKey){
            return eventStore[sKey];
        },
        /**
        			í•´ë‹¹ í‚¤ì— ì´ë²¤íŠ¸ê°€ ìžˆëŠ”ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
			
			@method  hasEvent
			@ignore
			@param {String} sKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ê°’
			@param {String} sEvent ì´ë²¤íŠ¸ëª…
         */
        hasEvent : function(sKey, sEvent,realEvent){
            if(!document.addEventListener && sEvent.toLowerCase() == "domready"){
                if(nv.$Element._domready.list){
                    return nv.$Element._domready.list.length > 0 ? true : false;
                }else{
                    return false;
                }
            }
            
            // sEvent = nv.$Element.eventManager.revisionEvent("", sEvent,realEvent);
            
            try{
                return !!eventStore[sKey]["event"][sEvent];
            }catch(e){
                return false;
            }
        },
        /**
        			í•´ë‹¹ ê·¸ë£¹ì´ ìžˆëŠ”ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
			
			@method hasGroup
			@ignore
			@param {String} sKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ê°’ 
			@param {String} sEvent ì´ë²¤íŠ¸ ëª…
			@param {String} sEvent ê·¸ë£¹ëª…
         */
        hasGroup : function(sKey, sEvent, sGroup){
            return !!eventStore[sKey]["event"][sEvent]["type"][sGroup];
        },
        createEvent : function(wEvent,realEvent,element,delegatedElement){
            // wEvent = wEvent || window.event;
            if (wEvent.currentTarget === undefined) {
                wEvent.currentTarget = element;
            }
            var weEvent = nv.$Event(wEvent);
            if(!weEvent.currentElement){
                weEvent.currentElement = element;
            }
            weEvent.realType = realEvent;
            weEvent.delegatedElement = delegatedElement;
            return weEvent;
        },
        /**
        			ì´ë²¤íŠ¸ë¥¼ ì´ˆê¸°í™” í•˜ëŠ” í•¨ìˆ˜
			
			@method initEvent
			@ignore
			@param {Hash+} oThis this ê°ì²´
			@param {String} sEvent ì´ë²¤íŠ¸ ëª…
			@param {String} sEvent ê·¸ë£¹ëª…
         */
        initEvent : function(oThis, sEvent, realEvent, sGroup){
            var sKey = oThis._key;
            var oEvent = eventStore[sKey]["event"];
            var that = this;
            
            var fAroundFunc = bind(function(sEvent,realEvent,scope,wEvent){
                wEvent = wEvent || window.event;
                var oEle = wEvent.target || wEvent.srcElement;
                var oManager = nv.$Element.eventManager;
                var oConfig = oManager.getEventConfig((wEvent.currentTarget||this._element).__nv__id);
                
                var oType = oConfig["event"][sEvent].type;
                for(var i in oType){
                    if(oType.hasOwnProperty(i)){
                        var aNormal = oType[i].normal;
                        for(var j = 0, l = aNormal.length; j < l; j++){
                            aNormal[j].call(this,scope.createEvent(wEvent,realEvent,this._element,null));
                        }
                        var oDelegate = oType[i].delegate;
                        var aResultFilter;
                        var afpFilterCallback;
                        for(var k in oDelegate){
                            if(oDelegate.hasOwnProperty(k)){
                                aResultFilter = oDelegate[k].checker(oEle);
                                if(aResultFilter[0]){
                                    afpFilterCallback = oDelegate[k].callback;
                                    var weEvent;//.element = aResultFilter[1];
                                    for(var m = 0, leng = afpFilterCallback.length; m < leng ; m++){
                                        weEvent = scope.createEvent(wEvent,realEvent,this._element,aResultFilter[1]);
                                        weEvent.element = aResultFilter[1];
                                        afpFilterCallback[m].call(this, weEvent);
                                    }
                                }
                            }
                        }
                    }
                    
                }
            },oThis,[sEvent,realEvent,this]);
            
            oEvent[sEvent] = {
                "listener" : fAroundFunc,
                "type" :{}
            }   ;
            
            nv.$Element._eventBind(oThis._element,sEvent,fAroundFunc,(realEvent==="focusin" || realEvent==="focusout"));
            
        },
        /**
        			ê·¸ë£¹ì„ ì´ˆê¸°í™” í•˜ëŠ” í•¨ìˆ˜
			
			@method initGroup
			@ignore
			@param {String} sKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ê°’
			@param {String} sEvent ì´ë²¤íŠ¸ ëª…
			@param {String} sEvent ê·¸ë£¹ëª…
         */
        initGroup : function(sKey, sEvent, sGroup){
            var oType = eventStore[sKey]["event"][sEvent]["type"];
            oType[sGroup] = {
                "normal" : [],
                "delegate" :{}
            };
        },
        /**
        			ì´ë²¤íŠ¸ë¥¼ ì¶”ê°€í•˜ëŠ” í•¨ìˆ˜
			
			@method addEventListener
			@ignore
			@param {String} ssKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ ê°’
			@param {String} sEvent ì´ë²¤íŠ¸ëª…
			@param {String} sGroup ê·¸ë£¹ëª…
			@param {String} sType delegateì¸ì§€ ì¼ë°˜ ì´ë²¤íŠ¸ì¸ì§€ í™•ì¸.
			@param {Function} vFilter í•„í„°ë§í•˜ëŠ” cssì„ íƒìž í˜¹ì€ í•„í„°í•¨ìˆ˜
			@param {Function} fpCallback ì½œë°±í•¨ìˆ˜
         */
        addEventListener : function(sKey, sEvent, sGroup, sType, vFilter, fpCallback){
            
            var oEventInfo = eventStore[sKey]["event"][sEvent]["type"][sGroup];
            
            if(sType === "normal"){
                oEventInfo.normal.push(fpCallback);
            }else if(sType === "delegate"){
                if(!this.hasDelegate(oEventInfo,vFilter)){
                    this.initDelegate(eventStore[sKey].ele,oEventInfo,vFilter);
                }
                this.addDelegate(oEventInfo,vFilter,fpCallback);
            }
            
        },
        /**
         			delegateê°€ ìžˆëŠ”ì§€ í™•ì¸í•˜ëŠ” í•¨ìˆ˜.
			
			@method hasDelegate
			@ignore
			@param {Hash+} oEventInfo ì´ë²¤íŠ¸ ì •ë³´ê°ì²´
			@param {Function} vFilter í•„í„°ë§í•˜ëŠ” cssì„ íƒìž í˜¹ì€ í•„í„°í•¨ìˆ˜
         */
        hasDelegate : function(oEventInfo,vFilter){
            return !!oEventInfo.delegate[vFilter];
        },
        containsElement : function(eOwnEle, eTarget, sCssquery,bContainOwn){
            if(eOwnEle == eTarget&&bContainOwn){
                return nv.$$.test(eTarget,sCssquery);
            }
            var aSelectElement = nv.$$(sCssquery,eOwnEle);
            for(var i = 0, l = aSelectElement.length; i < l; i++){
                if(aSelectElement[i] == eTarget){
                    return true;
                }
            }  
            return false;
        },
        /**
        			delegateë¥¼ ì´ˆê¸°í™” í•˜ëŠ” í•¨ìˆ˜.
			
			@method initDelegate
			@ignore
			@param {Hash+} eOwnEle
			@param {Hash+} oEventInfo ì´ë²¤íŠ¸ ì •ë³´ê°ì²´
			@param {Function} vFilter í•„í„°ë§í•˜ëŠ” cssì„ íƒìž í˜¹ì€ í•„í„°í•¨ìˆ˜
         */
        initDelegate : function(eOwnEle,oEventInfo,vFilter){
            var fpCheck;
            if(nv.$Jindo.isString(vFilter)){
                fpCheck = bind(function(eOwnEle,sCssquery,oEle){
                    var eIncludeEle = oEle;
                    var isIncludeEle = this.containsElement(eOwnEle, oEle, sCssquery,true);
                    if(!isIncludeEle){
                        var aPropagationElements = this._getParent(eOwnEle,oEle);
                        for(var i = 0, leng = aPropagationElements.length ; i < leng ; i++){
                            eIncludeEle = aPropagationElements[i];
                            if(this.containsElement(eOwnEle, eIncludeEle, sCssquery)){
                                isIncludeEle = true;
                                break;
                            }
                        }
                    }
                    return [isIncludeEle,eIncludeEle];
                },this,[eOwnEle,vFilter]);
            }else{
                fpCheck = bind(function(eOwnEle,fpFilter,oEle){
                    var eIncludeEle = oEle;
                    var isIncludeEle = fpFilter(eOwnEle,oEle);
                    if(!isIncludeEle){
                        var aPropagationElements = this._getParent(eOwnEle,oEle);
                        for(var i = 0, leng = aPropagationElements.length ; i < leng ; i++){
                            eIncludeEle = aPropagationElements[i];
                            if(fpFilter(eOwnEle,eIncludeEle)){
                                isIncludeEle = true;
                                break;
                            }
                        }
                    }
                    return [isIncludeEle,eIncludeEle];
                },this,[eOwnEle,vFilter]);
            }
            oEventInfo.delegate[vFilter] = {
                "checker" : fpCheck,
                "callback" : []
            };
        },
        /**
        			delegateë¥¼ ì¶”ê°€í•˜ëŠ” í•¨ìˆ˜.
			
			@method addDelegate
			@ignore
			@param {Hash+} oEventInfo ì´ë²¤íŠ¸ ì •ë³´ê°ì²´
			@param {Function} vFilter í•„í„°ë§í•˜ëŠ” cssì„ íƒìž í˜¹ì€ í•„í„°í•¨ìˆ˜
			@param {Function} fpCallback ì½œë°±í•¨ìˆ˜
         */
        addDelegate : function(oEventInfo,vFilter,fpCallback){
            oEventInfo.delegate[vFilter].callback.push(fpCallback);
        },
        /**
        			ì´ë²¤íŠ¸ë¥¼ í•´ì œí•˜ëŠ” í•¨ìˆ˜.
			
			@method removeEventListener
			@ignore
			@param {String} ssKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ ê°’
			@param {String} sEvent ì´ë²¤íŠ¸ëª…
			@param {String} sGroup ê·¸ë£¹ëª…
			@param {String} sType delegateì¸ì§€ ì¼ë°˜ ì´ë²¤íŠ¸ì¸ì§€ í™•ì¸.
			@param {Function} vFilter í•„í„°ë§í•˜ëŠ” cssì„ íƒìž í˜¹ì€ í•„í„°í•¨ìˆ˜
			@param {Function} fpCallback ì½œë°±í•¨ìˆ˜
         */
        removeEventListener : function(sKey, sEvent, sGroup, sType, vFilter, fpCallback){
            var oEventInfo;
            try{
                oEventInfo = eventStore[sKey]["event"][sEvent]["type"][sGroup];
            }catch(e){
                return;
            }
            var aNewCallback = [];
            var aOldCallback;
            if(sType === "normal"){
                aOldCallback = oEventInfo.normal;
            }else{
                // console.log(oEventInfo.delegate,oEventInfo.delegate[vFilter],vFilter);
                aOldCallback  = oEventInfo.delegate[vFilter].callback;
            }
            if (sEvent == nv._p_.NONE_GROUP || nv.$Jindo.isFunction(fpCallback)) {
                for(var i = 0, l = aOldCallback.length; i < l; i++){
                    if((aOldCallback[i]._origin_||aOldCallback[i]) != fpCallback){
                        aNewCallback.push(aOldCallback[i]);
                    }
                }
            }
            if(sType === "normal"){
                
                delete oEventInfo.normal;
                oEventInfo.normal = aNewCallback;
            }else if(sType === "delegate"){
                delete oEventInfo.delegate[vFilter].callback;
                oEventInfo.delegate[vFilter].callback = aNewCallback;
            }
            
            this.cleanUp(sKey, sEvent);
        },
        /**
        			ëª¨ë“  ì´ë²¤íŠ¸ë¥¼ í•´ì œí•˜ëŠ” í•¨ìˆ˜(ì ˆëŒ€ ì‚¬ìš©ë¶ˆê°€.)
			
			@method cleanUpAll
			@ignore
         */
        cleanUpAll : function(){
            var oEvent;
            for(var sKey in eventStore){
                if (eventStore.hasOwnProperty(sKey)) {
                    this.cleanUpUsingKey(sKey, true);
                }
            }
        },
        /**
        			ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ë¥¼ ì´ìš©í•˜ì—¬ ëª¨ë“  ì´ë²¤íŠ¸ë¥¼ ì‚­ì œí•  ë•Œ ì‚¬ìš©.
			
			@method cleanUpUsingKey
			@ignore
			@param {String} sKey
         */
        cleanUpUsingKey : function(sKey, bForce){
            var oEvent;
            
            if(!eventStore[sKey] || !eventStore[sKey].event){
            	return;
            }
            
            oEvent = eventStore[sKey].event;
            
            for(var sEvent in oEvent){
                if (oEvent.hasOwnProperty(sEvent)) {
                    this.cleanUp(sKey, sEvent, bForce);
                }
            }
        },
        /**
        			í‚¤ì— í•´ë‹¹í•˜ëŠ” ëª¨ë“  ì´ë²¤íŠ¸ë¥¼ í•´ì œí•˜ëŠ” í•¨ìˆ˜(ì ˆëŒ€ ì‚¬ìš©ë¶ˆê°€)
			
			@method cleanUp
			@ignore
			@param {String} ssKey ì—˜ë¦¬ë¨¼íŠ¸ í‚¤ ê°’
			@param {String} sEvent ì´ë²¤íŠ¸ëª…
			@param {Boolean} bForce ê°•ì œë¡œ í•´ì œí•  ê²ƒì¸ì§€ ì—¬ë¶€
         */
        cleanUp : function(sKey, sEvent, bForce){
            var oTypeInfo; 
            try{
                oTypeInfo = eventStore[sKey]["event"][sEvent]["type"];
            }catch(e){
                return;
                
            }
            var oEventInfo;
            var bHasEvent = false;
            if(!bForce){
                for(var i in oTypeInfo){
                    if (oTypeInfo.hasOwnProperty(i)) {
                        oEventInfo = oTypeInfo[i];
                        if(oEventInfo.normal.length){
                            bHasEvent = true;
                            break;
                        }
                        var oDele = oEventInfo.delegate;
                        for(var j in oDele){ 
                            if (oDele.hasOwnProperty(j)) {
                                if(oDele[j].callback.length){
                                    bHasEvent = true;
                                    break;
                                }
                            }
                        }
                        if(bHasEvent) break;
                        
                    }
                }
            }
            if(!bHasEvent){
                nv.$Element._unEventBind(eventStore[sKey].ele, sEvent, eventStore[sKey]["event"][sEvent]["listener"]);
                delete eventStore[sKey]["event"][sEvent];
                var bAllDetach = true;
                var oEvent = eventStore[sKey]["event"];
                for(var k in oEvent){
                    if (oEvent.hasOwnProperty(k)) {
                        bAllDetach = false;
                        break;
                    }
                }
                if(bAllDetach){
                    delete eventStore[sKey];
                }
            }
        },
        /**
        			ì´ë²¤íŠ¸ ëª…ê³¼ ê·¸ë£¹ì„ êµ¬ë¶„í•˜ëŠ” í•¨ìˆ˜.
			
			@method splitGroup
			@ignore
			@param {String} sEvent ì´ë²¤íŠ¸ëª…
         */
        splitGroup : function(sEvent){
            var aMatch = /\s*(.+?)\s*\(\s*(.*?)\s*\)/.exec(sEvent);
            if(aMatch){
                return {
                    "event" : aMatch[1].toLowerCase(),
                    "group" : aMatch[2].toLowerCase()
                };
            }else{
                return {
                    "event" : sEvent.toLowerCase(),
                    "group" : nv._p_.NONE_GROUP
                };
            }
        },
        /**
        			delegateì—ì„œ ë¶€ëª¨ë¥¼ ì°¾ëŠ” í•¨ìˆ˜.
			
			@method _getParent
			@ignore
			@param {Element} oOwnEle ìžì‹ ì˜ ì—˜ë¦¬ë¨¼íŠ¸
			@param {Element} oEle ë¹„êµ ì—˜ë¦¬ë¨¼íŠ¸
         */
        _getParent : function(oOwnEle, oEle){
            var e = oOwnEle;
            var a = [], p = null;
            var oDoc = oEle.ownerDocument || oEle.document || document;
            while (oEle.parentNode && p != e) {
                p = oEle.parentNode;
                if (p == oDoc.documentElement) break;
                a[a.length] = p;
                oEle = p;
            }
        
            return a;
        }
    };
})();
/*
// $Elementì˜ ë³´ê´€ êµ¬ì¡°.
//
// {
//	"key" : {
//		"ele" : ele,
//		"event" : {
//			"click":{
//				"listener" : function(){},
//				"type":{
//					"-none-" : {
//						"normal" : [],
//						"delegate" :{
//							"vFilter" :{
//								"checker" : function(){},
//								"callback" : [function(){}]
//							}
//							
//						}
//					}
//				}
//			}
//		}
//	}
//}
 */
//-!nv.$Element.event_etc.hidden end!-//

//-!nv.$Element.domready.hidden start!-//
/**
	Emulates the domready (=DOMContentLoaded) event in Internet Explorer.
	
	@method _domready
	@filter desktop
	@ignore
*/
nv.$Element._domready = function(doc, func) {
    if (nv.$Element._domready.list === undefined) {
        var f = null;
        
        nv.$Element._domready.list = [func];
        
        // use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        var done = false, execFuncs = function(){
            if(!done) {
                done = true;
                var l = nv.$Element._domready.list.concat();
                var evt = {
                    type : "domready",
                    target : doc,
                    currentTarget : doc
                };

                while(f = l.shift()) f(evt);
            }
        };
        
        (function (){
            try {
                doc.documentElement.doScroll("left");
            } catch(e) {
                setTimeout(arguments.callee, 50);
                return;
            }
            execFuncs();
        })();

        // trying to always fire before onload
        doc.onreadystatechange = function() {
            if (doc.readyState == 'complete') {
                doc.onreadystatechange = null;
                execFuncs();
            }
        };

    } else {
        nv.$Element._domready.list.push(func);
    }
};

//-!nv.$Element.domready.hidden end!-//



/**
 	@fileOverview $Elementì˜ í™•ìž¥ ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name element.extend.js
	@author NAVER Ajax Platform
 */

//-!nv.$Element.prototype.appear start(nv.$Element.prototype.opacity,nv.$Element.prototype.show)!-//
/**
 	appear() ë©”ì„œë“œëŠ” HTML ìš”ì†Œë¥¼ ì„œì„œížˆ ë‚˜íƒ€ë‚˜ê²Œ í•œë‹¤(Fade-in íš¨ê³¼)
	
	@method appear
	@param {Numeric} [nDuration] HTML ìš”ì†Œê°€ ì™„ì „ížˆ ë‚˜íƒ€ë‚  ë•Œê¹Œì§€ ê±¸ë¦¬ëŠ” ì‹œê°„. ë‹¨ìœ„ëŠ” ì´ˆ(second)ì´ë‹¤.
	@param {Function} [fCallback] HTML ìš”ì†Œê°€ ì™„ì „ížˆ ë‚˜íƒ€ë‚œ í›„ì— ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜.
	@return {this} Fade-in íš¨ê³¼ë¥¼ ì ìš©í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark
		<ul class="disc">
			<li>ì¸í„°ë„· ìµìŠ¤í”Œë¡œëŸ¬ 6 ë²„ì „ì—ì„œ filterë¥¼ ì‚¬ìš©í•˜ë©´ì„œ í•´ë‹¹ ìš”ì†Œê°€ position ì†ì„±ì„ ê°€ì§€ê³  ìžˆìœ¼ë©° ì‚¬ë¼ì§€ëŠ” ë¬¸ì œê°€ ìžˆë‹¤. ì´ ê²½ìš°ì—ëŠ” HTML ìš”ì†Œì— position ì†ì„±ì´ ì—†ì–´ì•¼ ì •ìƒì ìœ¼ë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.</li>
			<li>Webkit ê¸°ë°˜ì˜ ë¸Œë¼ìš°ì €(Safari 5 ë²„ì „ ì´ìƒ, Mobile Safari, Chrome, Mobile Webkit), Opear 10.60 ë²„ì „ ì´ìƒì˜ ë¸Œë¼ìš°ì €ì—ì„œëŠ” CSS3 transition ì†ì„±ì„ ì‚¬ìš©í•œë‹¤. ê·¸ ì´ì™¸ì˜ ë¸Œë¼ìš°ì €ì—ì„œëŠ” ìžë°”ìŠ¤í¬ë¦½íŠ¸ë¥¼ ì‚¬ìš©í•œë‹¤.</li>
		</ul>
	@see http://www.w3.org/TR/css3-transitions/ CSS Transitions - W3C
	@see nv.$Element#show
	@see nv.$Element#disappear
	@example
		$Element("sample1").appear(5, function(){
			$Element("sample2").appear(3);
		});
		
		//Before
		<div style="display: none; background-color: rgb(51, 51, 153); width: 100px; height: 50px;" id="sample1">
			<div style="display: none; background-color: rgb(165, 10, 81); width: 50px; height: 20px;" id="sample2">
			</div>
		</div>
		
		//After(1) : sample1 ìš”ì†Œê°€ ë‚˜íƒ€ë‚¨
		<div style="display: block; background-color: rgb(51, 51, 153); width: 100px; height: 50px; opacity: 1;" id="sample1">
			<div style="display: none; background-color: rgb(165, 10, 81); width: 50px; height: 20px;" id="sample2">
			</div>
		</div>
		
		//After(2) : sample2 ìš”ì†Œê°€ ë‚˜íƒ€ë‚¨
		<div style="display: block; background-color: rgb(51, 51, 153); width: 100px; height: 50px; opacity: 1;" id="sample1">
			<div style="display: block; background-color: rgb(165, 10, 81); width: 50px; height: 20px; opacity: 1;" id="sample2">
			</div>
		</div>
 */
nv.$Element.prototype.appear = function(duration, callback) {
    //-@@$Element.appear-@@//
    var oTransition = nv._p_.getStyleIncludeVendorPrefix();
    var name = oTransition.transition;
    var endName = name == "transition" ? "end" : "End";

    function appear() {
        var oArgs = g_checkVarType(arguments, {
            '4voi' : [ ],
            '4num' : [ 'nDuration:Numeric'],
            '4fun' : [ 'nDuration:Numeric' ,'fpCallback:Function+']
        },"$Element#appear");
        switch(oArgs+""){
            case "4voi":
                duration = 0.3;
                callback = function(){};
                break;
            case "4num":
                duration = oArgs.nDuration;
                callback = function(){};
                break;
            case "4fun":
                duration = oArgs.nDuration;
                callback = oArgs.fpCallback;
                
        }
        return [duration, callback];
    }

    if(oTransition.transition) {
        nv.$Element.prototype.appear = function(duration, callback) {
            var aOption = appear.apply(this,nv._p_._toArray(arguments));
            duration = aOption[0];
            callback = aOption[1];
            var self = this;
            
            if(this.visible()){
                
                setTimeout(function(){
                    callback.call(self,self);
                },16);
                
                return this; 
            }
            
            
            var ele = this._element;
            var name = oTransition.transition;
            var bindFunc = function(){
                self.show();
                ele.style[name + 'Property'] = '';
                ele.style[name + 'Duration'] = '';
                ele.style[name + 'TimingFunction'] = '';
                ele.style.opacity = '';
                callback.call(self,self);
                ele.removeEventListener(name+endName, arguments.callee , false );
            };
            if(!this.visible()){
                ele.style.opacity = ele.style.opacity||0;
                self.show();
            }
            ele.addEventListener( name+endName, bindFunc , false );
            ele.style[name + 'Property'] = 'opacity';
            ele.style[name + 'Duration'] = duration+'s';
            ele.style[name + 'TimingFunction'] = 'linear';

            nv._p_.setOpacity(ele,"1");
            return this;
        };
    } else {
        nv.$Element.prototype.appear = function(duration, callback) {
            var aOption = appear.apply(this,nv._p_._toArray(arguments));
            duration = aOption[0];
            callback = aOption[1];
            var self = this;
            var op   = this.opacity();
            if(this._getCss(this._element,"display")=="none") op = 0;
            
            if (op == 1) return this;
            try { clearTimeout(this._fade_timer); } catch(e){}

            var step = (1-op) / ((duration||0.3)*100);
            var func = function(){
                op += step;
                self.opacity(op);

                if (op >= 1) {
                    self._element.style.filter="";
                    callback.call(self,self);
                } else {
                    self._fade_timer = setTimeout(func, 10);
                }
            };

            this.show();
            func();
            return this;
        };
    }
    return this.appear.apply(this,arguments);
    
};
//-!nv.$Element.prototype.appear end!-//

//-!nv.$Element.prototype.disappear start(nv.$Element.prototype.opacity)!-//
/**
 	disappear() ë©”ì„œë“œëŠ” HTML ìš”ì†Œë¥¼ ì„œì„œížˆ ì‚¬ë¼ì§€ê²Œ í•œë‹¤(Fade-out íš¨ê³¼).
	
	@method disappear
	@param {Numeric} [nDuration] HTML ìš”ì†Œ ì™„ì „ížˆ ì‚¬ë¼ì§ˆ ë•Œê¹Œì§€ ê±¸ë¦¬ëŠ” ì‹œê°„. (ë‹¨ìœ„ ì´ˆ)
	@param {Function} [fCallback] HTML ìš”ì†Œê°€ ì™„ì „ížˆ ì‚¬ë¼ì§„ í›„ì— ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜.
	@return {this} Fade-out íš¨ê³¼ë¥¼ ì ìš©í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark
		<ul class="disc">
			<li>HTML ìš”ì†Œê°€ ì™„ì „ížˆ ì‚¬ë¼ì§€ë©´ í•´ë‹¹ ìš”ì†Œì˜ display ì†ì„±ì€ noneìœ¼ë¡œ ë³€í•œë‹¤.</li>
			<li>Webkit ê¸°ë°˜ì˜ ë¸Œë¼ìš°ì €(Safari 5 ë²„ì „ ì´ìƒ, Mobile Safari, Chrome, Mobile Webkit), Opear 10.6 ë²„ì „ ì´ìƒì˜ ë¸Œë¼ìš°ì €ì—ì„œëŠ” CSS3 transition ì†ì„±ì„ ì‚¬ìš©í•œë‹¤. ê·¸ ì´ì™¸ì˜ ë¸Œë¼ìš°ì €ì—ì„œëŠ” ìžë°”ìŠ¤í¬ë¦½íŠ¸ë¥¼ ì‚¬ìš©í•œë‹¤.</li>
		</ul>
	@see http://www.w3.org/TR/css3-transitions/ CSS Transitions - W3C
	@see nv.$Element#hide
	@see nv.$Element#appear
	@example
		$Element("sample1").disappear(5, function(){
			$Element("sample2").disappear(3);
		});
		
		//Before
		<div id="sample1" style="background-color: rgb(51, 51, 153); width: 100px; height: 50px;">
		</div>
		<div id="sample2" style="background-color: rgb(165, 10, 81); width: 100px; height: 50px;">
		</div>
		
		//After(1) : sample1 ìš”ì†Œê°€ ì‚¬ë¼ì§
		<div id="sample1" style="background-color: rgb(51, 51, 153); width: 100px; height: 50px; opacity: 1; display: none;">
		</div>
		<div id="sample2" style="background-color: rgb(165, 10, 81); width: 100px; height: 50px;">
		</div>
		
		//After(2) : sample2 ìš”ì†Œê°€ ì‚¬ë¼ì§
		<div id="sample1" style="background-color: rgb(51, 51, 153); width: 100px; height: 50px; opacity: 1; display: none;">
		</div>
		<div id="sample2" style="background-color: rgb(165, 10, 81); width: 100px; height: 50px; opacity: 1; display: none;">
		</div>
 */
nv.$Element.prototype.disappear = function(duration, callback) {
    //-@@$Element.disappear-@@//
    var oTransition = nv._p_.getStyleIncludeVendorPrefix();
    var name = oTransition.transition;
    var endName = name == "transition" ? "end" : "End";

    function disappear(){
        var oArgs = g_checkVarType(arguments, {
            '4voi' : [ ],
            '4num' : [ 'nDuration:Numeric'],
            '4fun' : [ 'nDuration:Numeric' ,'fpCallback:Function+']
        },"$Element#disappear");
        switch(oArgs+""){
            case "4voi":
                duration = 0.3;
                callback = function(){};
                break;
            case "4num":
                duration = oArgs.nDuration;
                callback = function(){};
                break;
            case "4fun":
                duration = oArgs.nDuration;
                callback = oArgs.fpCallback;
                
        }
        return [duration, callback];
    }
    if (oTransition.transition) {
        nv.$Element.prototype.disappear = function(duration, callback) {
            var aOption = disappear.apply(this,nv._p_._toArray(arguments));
            duration = aOption[0];
            callback = aOption[1];
            
            var self = this;
            
            if(!this.visible()){
                
                setTimeout(function(){
                    callback.call(self,self);
                },16);
                
                return this; 
            }
            
            // endName = "End";
            // var name = "MozTransition";
            var name = oTransition.transition;
            var ele = this._element;
            var bindFunc = function(){
                self.hide();
                ele.style[name + 'Property'] = '';
                ele.style[name + 'Duration'] = '';
                ele.style[name + 'TimingFunction'] = '';
                ele.style.opacity = '';
                callback.call(self,self);
                ele.removeEventListener(name+endName, arguments.callee , false );
            };

            ele.addEventListener( name+endName, bindFunc , false );
            ele.style[name + 'Property'] = 'opacity';
            ele.style[name + 'Duration'] = duration+'s';
            ele.style[name + 'TimingFunction'] = 'linear';
            
            nv._p_.setOpacity(ele,'0');
            return this;
        };
    }else{
        nv.$Element.prototype.disappear = function(duration, callback) {
            var aOption = disappear.apply(this,nv._p_._toArray(arguments));
            duration = aOption[0];
            callback = aOption[1];
            
            var self = this;
            var op   = this.opacity();
    
            if (op == 0) return this;
            try { clearTimeout(this._fade_timer); } catch(e){}

            var step = op / ((duration||0.3)*100);
            var func = function(){
                op -= step;
                self.opacity(op);

                if (op <= 0) {
                    self._element.style.display = "none";
                    self.opacity(1);
                    callback.call(self,self);
                } else {
                    self._fade_timer = setTimeout(func, 10);
                }
            };

            func();
            return this;
        };
    }
    return this.disappear.apply(this,arguments);
};
//-!nv.$Element.prototype.disappear end!-//

//-!nv.$Element.prototype.offset start!-//
/**
 	offset() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ìœ„ì¹˜ë¥¼ ê°€ì ¸ì˜¨ë‹¤.
	
	@method offset
	@return {Object} HTML ìš”ì†Œì˜ ìœ„ì¹˜ ê°’ì„ ê°ì²´ë¡œ ë°˜í™˜í•œë‹¤.
		@return {Number} .top ë¬¸ì„œì˜ ë§¨ ìœ„ì—ì„œ HTML ìš”ì†Œì˜ ìœ— ë¶€ë¶„ê¹Œì§€ì˜ ê±°ë¦¬
		@return {Number} .left ë¬¸ì„œì˜ ì™¼ìª½ ê°€ìž¥ìžë¦¬ì—ì„œ HTML ìš”ì†Œì˜ ì™¼ìª½ ê°€ìž¥ìžë¦¬ê¹Œì§€ì˜ ê±°ë¦¬
	@remark
		<ul class="disc">
			<li>ìœ„ì¹˜ë¥¼ ê²°ì •í•˜ëŠ” ê¸°ì¤€ì ì€ ë¸Œë¼ìš°ì €ê°€ íŽ˜ì´ì§€ë¥¼ í‘œì‹œí•˜ëŠ” í™”ë©´ì˜ ì™¼ìª½ ìœ„ ëª¨ì„œë¦¬ì´ë‹¤.</li>
			<li>HTML ìš”ì†Œê°€ ë³´ì´ëŠ” ìƒíƒœ(display)ì—ì„œ ì ìš©í•´ì•¼ í•œë‹¤. ìš”ì†Œê°€ í™”ë©´ì— ë³´ì´ì§€ ì•Šìœ¼ë©´ ì •ìƒì ìœ¼ë¡œ ë™ìž‘í•˜ì§€ ì•Šì„ ìˆ˜ ìžˆë‹¤.</li>
			<li>ì¼ë¶€ ë¸Œë¼ìš°ì €ì™€ ì¼ë¶€ ìƒí™©ì—ì„œ inline ìš”ì†Œì— ëŒ€í•œ ìœ„ì¹˜ë¥¼ ì˜¬ë°”ë¥´ê²Œ êµ¬í•˜ì§€ ëª»í•˜ëŠ” ë¬¸ì œê°€ ìžˆìœ¼ë©°, ì´ ê²½ìš° í•´ë‹¹ ìš”ì†Œì˜ position ì†ì„±ì„ relative ê°’ìœ¼ë¡œ ë°”ê¿”ì„œ í•´ê²°í•  ìˆ˜ ìžˆë‹¤.</li>
		</ul>
	@example
		<style type="text/css">
			div { background-color:#2B81AF; width:20px; height:20px; float:left; left:100px; top:50px; position:absolute;}
		</style>
		
		<div id="sample"></div>
		
		// ìœ„ì¹˜ ê°’ ì¡°íšŒ
		$Element("sample").offset(); // { left=100, top=50 }
 */
/**
 	offset() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ìœ„ì¹˜ë¥¼ ì„¤ì •í•œë‹¤.
	
	@method offset
	@param {Numeric} nTop ë¬¸ì„œì˜ ë§¨ ìœ„ì—ì„œ HTML ìš”ì†Œì˜ ìœ— ë¶€ë¶„ê¹Œì§€ì˜ ê±°ë¦¬. ë‹¨ìœ„ëŠ” í”½ì…€(px)ì´ë‹¤.
	@param {Numeric} nLeft ë¬¸ì„œì˜ ì™¼ìª½ ê°€ìž¥ìžë¦¬ì—ì„œ HTML ìš”ì†Œì˜ ì™¼ìª½ ê°€ìž¥ìžë¦¬ê¹Œì§€ì˜ ê±°ë¦¬. ë‹¨ìœ„ëŠ” í”½ì…€(px)ì´ë‹¤.
	@return {this} ìœ„ì¹˜ ê°’ì„ ë°˜ì˜í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark
		<ul class="disc">
			<li>ìœ„ì¹˜ë¥¼ ê²°ì •í•˜ëŠ” ê¸°ì¤€ì ì€ ë¸Œë¼ìš°ì €ê°€ íŽ˜ì´ì§€ë¥¼ í‘œì‹œí•˜ëŠ” í™”ë©´ì˜ ì™¼ìª½ ìœ„ ëª¨ì„œë¦¬ì´ë‹¤.</li>
			<li>HTML ìš”ì†Œê°€ ë³´ì´ëŠ” ìƒíƒœ(display)ì—ì„œ ì ìš©í•´ì•¼ í•œë‹¤. ìš”ì†Œê°€ í™”ë©´ì— ë³´ì´ì§€ ì•Šìœ¼ë©´ ì •ìƒì ìœ¼ë¡œ ë™ìž‘í•˜ì§€ ì•Šì„ ìˆ˜ ìžˆë‹¤.</li>
			<li>ì¼ë¶€ ë¸Œë¼ìš°ì €ì™€ ì¼ë¶€ ìƒí™©ì—ì„œ inline ìš”ì†Œì— ëŒ€í•œ ìœ„ì¹˜ë¥¼ ì˜¬ë°”ë¥´ê²Œ êµ¬í•˜ì§€ ëª»í•˜ëŠ” ë¬¸ì œê°€ ìžˆìœ¼ë©°, ì´ ê²½ìš° í•´ë‹¹ ìš”ì†Œì˜ position ì†ì„±ì„ relative ê°’ìœ¼ë¡œ ë°”ê¿”ì„œ í•´ê²°í•  ìˆ˜ ìžˆë‹¤.</li>
		</ul>
	@example
		<style type="text/css">
			div { background-color:#2B81AF; width:20px; height:20px; float:left; left:100px; top:50px; position:absolute;}
		</style>
		
		<div id="sample"></div>
		
		// ìœ„ì¹˜ ê°’ ì„¤ì •
		$Element("sample").offset(40, 30);
		
		//Before
		<div id="sample"></div>
		
		//After
		<div id="sample" style="top: 40px; left: 30px;"></div>
 */
nv.$Element.prototype.offset = function(nTop, nLeft) {
    //-@@$Element.offset-@@//
    var oArgs = g_checkVarType(arguments, {
        'g' : [ ],
        's' : [ 'nTop:Numeric', 'nLeft:Numeric']
    },"$Element#offset");
    
    switch(oArgs+""){
        case "g":
            return this.offset_get();
            
        case "s":
            return this.offset_set(oArgs.nTop, oArgs.nLeft);
            
    }
};

nv.$Element.prototype.offset_set = function(nTop,nLeft) {
    var oEl = this._element;
    var oPhantom = null;
    
    if (isNaN(parseFloat(this._getCss(oEl,'top')))) oEl.style.top = "0px";
    if (isNaN(parseFloat(this._getCss(oEl,'left')))) oEl.style.left = "0px";

    var oPos = this.offset_get();
    var oGap = { top : nTop - oPos.top, left : nLeft - oPos.left };
    oEl.style.top = parseFloat(this._getCss(oEl,'top')) + oGap.top + 'px';
    oEl.style.left = parseFloat(this._getCss(oEl,'left')) + oGap.left + 'px';

    return this;
};

nv.$Element.prototype.offset_get = function(nTop,nLeft) {
    var oEl = this._element,
        oPhantom = null,
        bIE = nv._p_._JINDO_IS_IE,
        nVer = 0;

    if(bIE) {
        nVer = document.documentMode || nv.$Agent().navigator().version;
    }

    var oPos = { left : 0, top : 0 },
        oDoc = oEl.ownerDocument || oEl.document || document,
        oHtml = oDoc.documentElement,
        oBody = oDoc.body;

    if(oEl.getBoundingClientRect) { // has getBoundingClientRect
        if(!oPhantom) {
            var bHasFrameBorder = (window == top);

            if(!bHasFrameBorder) {
                try {
                    bHasFrameBorder = (window.frameElement && window.frameElement.frameBorder == 1);
                } catch(e){}
            }

            if((bIE && nVer < 8 && window.external) && bHasFrameBorder&&document.body.contains(oEl)) {
                oPhantom = { left: 2, top: 2 };
            } else {
                oPhantom = { left: 0, top: 0 };
            }
        }

        var box;

        try {
            box = oEl.getBoundingClientRect();
        } catch(e) {
            box = { left: 0, top: 0};
        }

        if (oEl !== oHtml && oEl !== oBody) {
            oPos.left = box.left - oPhantom.left;
            oPos.top = box.top - oPhantom.top;
            oPos.left += oHtml.scrollLeft || oBody.scrollLeft;
            oPos.top += oHtml.scrollTop || oBody.scrollTop;

        }

    } else if (oDoc.getBoxObjectFor) { // has getBoxObjectFor
        var box = oDoc.getBoxObjectFor(oEl),
            vpBox = oDoc.getBoxObjectFor(oHtml || oBody);

        oPos.left = box.screenX - vpBox.screenX;
        oPos.top = box.screenY - vpBox.screenY;

    } else {
        for(var o = oEl; o; o = o.offsetParent) {
            oPos.left += o.offsetLeft;
            oPos.top += o.offsetTop;
        }

        for(var o = oEl.parentNode; o; o = o.parentNode) {
            if (o.tagName == 'BODY') break;
            if (o.tagName == 'TR') oPos.top += 2;

            oPos.left -= o.scrollLeft;
            oPos.top -= o.scrollTop;
        }
    }

    return oPos;
};
//-!nv.$Element.prototype.offset end!-//

//-!nv.$Element.prototype.evalScripts start!-//
/**
 	evalScripts() ë©”ì„œë“œëŠ” ë¬¸ìžì—´ì— í¬í•¨ëœ JavaScript ì½”ë“œë¥¼ ì‹¤í–‰í•œë‹¤.<br>
	&lt;script&gt; íƒœê·¸ê°€ í¬í•¨ëœ ë¬¸ìžì—´ì„ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•˜ë©´, &lt;script&gt; ì•ˆì— ìžˆëŠ” ë‚´ìš©ì„ íŒŒì‹±í•˜ì—¬ eval() ë©”ì„œë“œë¥¼ ìˆ˜í–‰í•œë‹¤.
	
	@method evalScripts
	@param {String+} sHTML &lt;script&gt; ìš”ì†Œê°€ í¬í•¨ëœ HTML ë¬¸ìžì—´.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		// script íƒœê·¸ê°€ í¬í•¨ëœ ë¬¸ìžì—´ì„ ì§€ì •
		var response = "<script type='text/javascript'>$Element('sample').appendHTML('<li>4</li>')</script>";
		
		$Element("sample").evalScripts(response);
		
		//Before
		<ul id="sample">
			<li>1</li>
			<li>2</li>
			<li>3</li>
		</ul>
		
		//After
		<ul id="sample">
			<li>1</li>
			<li>2</li>
			<li>3</li>
		<li>4</li></ul>
 */
nv.$Element.prototype.evalScripts = function(sHTML) {
    //-@@$Element.evalScripts-@@//
    var oArgs = g_checkVarType(arguments, {
        '4str' : [ "sHTML:String+" ]
    },"$Element#evalScripts");
    var aJS = [];
    var leftScript = '<script(\\s[^>]+)*>(.*?)</';
    var rightScript = 'script>';
    sHTML = sHTML.replace(new RegExp(leftScript+rightScript, 'gi'), function(_1, _2, sPart) { aJS.push(sPart); return ''; });
    eval(aJS.join('\n'));
    
    return this;

};
//-!nv.$Element.prototype.evalScripts end!-//

//-!nv.$Element.prototype.clone start!-//
/**
   	cloneNodeì™€ ê°™ì´ elementì„ ë³µì œí•˜ëŠ” ë©”ì„œë“œì´ë‹¤.  
  	@method clone
  	@since 2.8.0
	@param {Boolean} [bDeep=true] ìžì‹ë…¸ë“œê¹Œì§€ ë³µìˆ˜í• ì§€ ì—¬ë¶€(
	@return {nv.$Element} ë³µì œëœ $Element
	@example

		<div id="sample">
		    <div>Hello</div>
		</div>
		
		//ìžì‹ë…¸ë“œê¹Œì§€ ë³µì œ
		$Element("sample").clone(); 
		-> 
		$Element(
			<div id="sample">
	    		<div>Hello</div>
			</div>
		);
		
		//ë³¸ì¸ë…¸ë“œë§Œ ë³µì œ
		$Element("sample").clone(false); 
		-> 
		$Element(
			<div id="sample">
			</div>
		);
 */
nv.$Element.prototype.clone = function(bDeep) {
    var oArgs = g_checkVarType(arguments, {
        'default' : [ ],
        'set' : [ 'bDeep:Boolean' ]
    },"$Element#clone");
    
    if(oArgs+"" == "default") {
        bDeep = true;
    }
    
    return nv.$Element(this._element.cloneNode(bDeep));
};
//-!nv.$Element.prototype.clone end!-//

//-!nv.$Element._common.hidden start!-//
/**
 * @ignore
 */
nv.$Element._common = function(oElement,sMethod){

    try{
        return nv.$Element(oElement)._element;
    }catch(e){
        throw TypeError(e.message.replace(/\$Element/g,"$Element#"+sMethod).replace(/Element\.html/g,"Element.html#"+sMethod));
    }
};
//-!nv.$Element._common.hidden end!-//
//-!nv.$Element._prepend.hidden start(nv.$)!-//
/**
 	elementë¥¼ ì•žì— ë¶™ì¼ë•Œ ì‚¬ìš©ë˜ëŠ” í•¨ìˆ˜.
	
	@method _prepend
	@param {Element} elBase ê¸°ì¤€ ì—˜ë¦¬ë¨¼íŠ¸
	@param {Element} elAppend ë¶™ì¼ ì—˜ë¦¬ë¨¼íŠ¸
	@return {nv.$Element} ë‘ë²ˆì§¸ íŒŒë¼ë¯¸í„°ì˜ ì—˜ë¦¬ë¨¼íŠ¸
	@ignore
 */
nv.$Element._prepend = function(oParent, oChild){
    var nodes = oParent.childNodes;
    if (nodes.length > 0) {
        oParent.insertBefore(oChild, nodes[0]);
    } else {
        oParent.appendChild(oChild);
    }
};
//-!nv.$Element._prepend.hidden end!-//

//-!nv.$Element.prototype.append start(nv.$Element._common)!-//
/**
 	append() ë©”ì„œë“œëŠ” nv.$Element() ê°ì²´ì— ìžˆëŠ” ìš”ì†Œì˜ ë§ˆì§€ë§‰ ìžì‹ ë…¸ë“œë¡œ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ HTML ìš”ì†Œë¥¼ ë°°ì •í•œë‹¤.
	
	@method append
	@syntax sId
	@syntax vElement
	@param {String+} sId ë§ˆì§€ë§‰ ìžì‹ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œì˜ ID
	@param {Element+ | Node} vElement ë§ˆì§€ë§‰ ìžì‹ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œ(Element) ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#prepend
	@see nv.$Element#before
	@see nv.$Element#after
	@see nv.$Element#appendTo
	@see nv.$Element#prependTo
	@see nv.$Element#wrap
	@example
		// IDê°€ sample1ì¸ HTML ìš”ì†Œì—
		// IDê°€ sample2ì¸ HTML ìš”ì†Œë¥¼ ì¶”ê°€
		$Element("sample1").append("sample2");
		
		//Before
		<div id="sample2">
		    <div>Hello 2</div>
		</div>
		<div id="sample1">
		    <div>Hello 1</div>
		</div>
		
		//After
		<div id="sample1">
			<div>Hello 1</div>
			<div id="sample2">
				<div>Hello 2</div>
			</div>
		</div>
	@example
		// IDê°€ sampleì¸ HTML ìš”ì†Œì—
		// ìƒˆë¡œìš´ DIV ìš”ì†Œë¥¼ ì¶”ê°€
		var elChild = $("<div>Hello New</div>");
		$Element("sample").append(elChild);
		
		//Before
		<div id="sample">
			<div>Hello</div>
		</div>
		
		//After
		<div id="sample">
			<div>Hello </div>
			<div>Hello New</div>
		</div>
 */
nv.$Element.prototype.append = function(oElement) {
    //-@@$Element.append-@@//
    this._element.appendChild(nv.$Element._common(oElement,"append"));
    return this;
};
//-!nv.$Element.prototype.append end!-//

//-!nv.$Element.prototype.prepend start(nv.$Element._prepend)!-//
/** 
 	prepend() ë©”ì„œë“œëŠ” nv.$Element() ê°ì²´ì— ìžˆëŠ” ìš”ì†Œì˜ ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œë¡œ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ HTML ìš”ì†Œë¥¼ ë°°ì •í•œë‹¤.
	
	@method prepend
	@syntax sId
	@syntax vElement
	@param {String+} sId ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œì˜ ID
	@param {Element+ | Node} vElement ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œ(Element) ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#append
	@see nv.$Element#before
	@see nv.$Element#after
	@see nv.$Element#appendTo
	@see nv.$Element#prependTo
	@see nv.$Element#wrap
	@example
		// IDê°€ sample1ì¸ HTML ìš”ì†Œì—ì„œ
		// IDê°€ sample2ì¸ HTML ìš”ì†Œë¥¼ ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œë¡œ ì´ë™
		$Element("sample1").prepend("sample2");
		
		//Before
		<div id="sample1">
		    <div>Hello 1</div>
			<div id="sample2">
			    <div>Hello 2</div>
			</div>
		</div>
		
		//After
		<div id="sample1">
			<div id="sample2">
			    <div>Hello 2</div>
			</div>
		    <div>Hello 1</div>
		</div>
	@example
		// IDê°€ sampleì¸ HTML ìš”ì†Œì—
		// ìƒˆë¡œìš´ DIV ìš”ì†Œë¥¼ ì¶”ê°€
		var elChild = $("<div>Hello New</div>");
		$Element("sample").prepend(elChild);
		
		//Before
		<div id="sample">
			<div>Hello</div>
		</div>
		
		//After
		<div id="sample">
			<div>Hello New</div>
			<div>Hello</div>
		</div>
 */
nv.$Element.prototype.prepend = function(oElement) {
    //-@@$Element.prepend-@@//
    nv.$Element._prepend(this._element, nv.$Element._common(oElement,"prepend"));
    
    return this;
};
//-!nv.$Element.prototype.prepend end!-//

//-!nv.$Element.prototype.replace start(nv.$Element._common)!-//
/**
 	replace() ë©”ì„œë“œëŠ” nv.$Element() ê°ì²´ ë‚´ë¶€ì˜ HTML ìš”ì†Œë¥¼ ì§€ì •í•œ íŒŒë¼ë¯¸í„°ì˜ ìš”ì†Œë¡œ ëŒ€ì²´í•œë‹¤.
	
	@method replace
	@syntax sId
	@syntax vElement
	@param {String+} sId ëŒ€ì²´í•  HTML ìš”ì†Œì˜ ID
	@param {Element+ | Node} vElement ëŒ€ì²´í•  HTML ìš”ì†Œ(Element) ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		// IDê°€ sample1ì¸ HTML ìš”ì†Œì—ì„œ
		// IDê°€ sample2ì¸ HTML ìš”ì†Œë¡œ ëŒ€ì²´
		$Element('sample1').replace('sample2');
		
		//Before
		<div>
			<div id="sample1">Sample1</div>
		</div>
		<div id="sample2">Sample2</div>
		
		//After
		<div>
			<div id="sample2">Sample2</div>
		</div>
	@example
		// ìƒˆë¡œìš´ DIV ìš”ì†Œë¡œ ëŒ€ì²´
		$Element("btn").replace($("<div>Sample</div>"));
		
		//Before
		<button id="btn">Sample</button>
		
		//After
		<div>Sample</div>
 */
nv.$Element.prototype.replace = function(oElement) {
    //-@@$Element.replace-@@//
    oElement = nv.$Element._common(oElement,"replace");
    if(nv.cssquery) nv.cssquery.release();
    var e = this._element;
    var oParentNode = e.parentNode;
    if(oParentNode&&oParentNode.replaceChild){
        oParentNode.replaceChild(oElement,e);
        return this;
    }
    
    var _o = oElement;

    oParentNode.insertBefore(_o, e);
    oParentNode.removeChild(e);

    return this;
};
//-!nv.$Element.prototype.replace end!-//

//-!nv.$Element.prototype.appendTo start(nv.$Element._common)!-//
/**
 	appendTo() ë©”ì„œë“œëŠ” nv.$Element() ê°ì²´ì— ìžˆëŠ” ìš”ì†Œë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œì˜ ë§ˆì§€ë§‰ ìžì‹ ìš”ì†Œë¡œ ë°°ì •í•œë‹¤.
	
	@method appendTo
	@syntax sId
	@syntax vElement
	@param {String+} sId ë§ˆì§€ë§‰ ìžì‹ ë…¸ë“œê°€ ë°°ì • ë  HTML ìš”ì†Œì˜ ID
	@param {Element+ | Node} vElement ë§ˆì§€ë§‰ ìžì‹ ë…¸ë“œê°€ ë°°ì • ë  HTML ìš”ì†Œ(Element) ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#append
	@see nv.$Element#prepend
	@see nv.$Element#before
	@see nv.$Element#after
	@see nv.$Element#prependTo
	@see nv.$Element#wrap
	@example
		// IDê°€ sample2ì¸ HTML ìš”ì†Œì—
		// IDê°€ sample1ì¸ HTML ìš”ì†Œë¥¼ ì¶”ê°€
		$Element("sample1").appendTo("sample2");
		
		//Before
		<div id="sample1">
		    <div>Hello 1</div>
		</div>
		<div id="sample2">
		    <div>Hello 2</div>
		</div>
		
		//After
		<div id="sample2">
		    <div>Hello 2</div>
			<div id="sample1">
			    <div>Hello 1</div>
			</div>
		</div>
 */
nv.$Element.prototype.appendTo = function(oElement) {
    //-@@$Element.appendTo-@@//
    nv.$Element._common(oElement,"appendTo").appendChild(this._element);
    return this;
};
//-!nv.$Element.prototype.appendTo end!-//

//-!nv.$Element.prototype.prependTo start(nv.$Element._prepend, nv.$Element._common)!-//
/**
 	prependTo() ë©”ì„œë“œëŠ” nv.$Element() ê°ì²´ì— ìžˆëŠ” ìš”ì†Œë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œì˜ ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œë¡œ ë°°ì •í•œë‹¤.
	
	@method prependTo
	@syntax sId
	@syntax vElement
	@param {String+} sId ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œê°€ ë°°ì • ë  HTML ìš”ì†Œì˜ ID
	@param {Element+ | Node} vElement ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œê°€ ë°°ì • ë  HTML ìš”ì†Œ(Element) ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#append
	@see nv.$Element#prepend
	@see nv.$Element#before
	@see nv.$Element#after
	@see nv.$Element#appendTo
	@see nv.$Element#wrap
	@example
		// IDê°€ sample2ì¸ HTML ìš”ì†Œì—
		// IDê°€ sample1ì¸ HTML ìš”ì†Œë¥¼ ì¶”ê°€
		$Element("sample1").prependTo("sample2");
		
		//Before
		<div id="sample1">
		    <div>Hello 1</div>
		</div>
		<div id="sample2">
		    <div>Hello 2</div>
		</div>
		
		//After
		<div id="sample2">
			<div id="sample1">
			    <div>Hello 1</div>
			</div>
		    <div>Hello 2</div>
		</div>
 */
nv.$Element.prototype.prependTo = function(oElement) {
    //-@@$Element.prependTo-@@//
    nv.$Element._prepend(nv.$Element._common(oElement,"prependTo"), this._element);
    return this;
};
//-!nv.$Element.prototype.prependTo end!-//

//-!nv.$Element.prototype.before start(nv.$Element._common)!-//
/**
 	before() ë©”ì„œë“œëŠ” nv.$Element() ê°ì²´ì— ìžˆëŠ” ìš”ì†Œì˜ ì´ì „ í˜•ì œ ë…¸ë“œ(previousSibling)ë¡œ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œë¥¼ ë°°ì •í•œë‹¤.
	
	@method before
	@syntax sId
	@syntax vElement
	@param {String+} sId ì´ì „ í˜•ì œ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œì˜ ID
	@param {Element+ | Node} vElement ì´ì „ í˜•ì œ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œ(Element) ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#append
	@see nv.$Element#prepend
	@see nv.$Element#after
	@see nv.$Element#appendTo
	@see nv.$Element#prependTo
	@see nv.$Element#wrap
	@example
		// IDê°€ sample1ì¸ HTML ìš”ì†Œ ì•žì—
		// IDê°€ sample2ì¸ HTML ìš”ì†Œë¥¼ ì¶”ê°€ í•¨
		$Element("sample1").before("sample2"); // sample2ë¥¼ ëž˜í•‘í•œ $Element ë¥¼ ë°˜í™˜
		
		//Before
		<div id="sample1">
		    <div>Hello 1</div>
			<div id="sample2">
			    <div>Hello 2</div>
			</div>
		</div>
		
		//After
		<div id="sample2">
			<div>Hello 2</div>
		</div>
		<div id="sample1">
		  <div>Hello 1</div>
		</div>
	@example
		// ìƒˆë¡œìš´ DIV ìš”ì†Œë¥¼ ì¶”ê°€
		var elNew = $("<div>Hello New</div>");
		$Element("sample").before(elNew); // elNew ìš”ì†Œë¥¼ ëž˜í•‘í•œ $Element ë¥¼ ë°˜í™˜
		
		//Before
		<div id="sample">
			<div>Hello</div>
		</div>
		
		//After
		<div>Hello New</div>
		<div id="sample">
			<div>Hello</div>
		</div>
 */
nv.$Element.prototype.before = function(oElement) {
    //-@@$Element.before-@@//
    var o = nv.$Element._common(oElement,"before");

    this._element.parentNode.insertBefore(o, this._element);

    return this;
};
//-!nv.$Element.prototype.before end!-//

//-!nv.$Element.prototype.after start(nv.$Element.prototype.before, nv.$Element._common)!-//
/**
 	after() ë©”ì„œë“œëŠ” nv.$Element() ê°ì²´ì— ìžˆëŠ” ìš”ì†Œì˜ ë‹¤ìŒ í˜•ì œ ë…¸ë“œ(nextSibling)ë¡œ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œë¥¼ ë°°ì •í•œë‹¤.
	
	@method after
	@syntax sId
	@syntax vElement
	@param {String+} sId ë‹¤ìŒ í˜•ì œ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œì˜ ID
	@param {Element+ | Node} vElement ë‹¤ìŒ í˜•ì œ ë…¸ë“œë¡œ ë°°ì •í•  HTML ìš”ì†Œ(Element) ë˜ëŠ” nv.$Element() ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#append
	@see nv.$Element#prepend
	@see nv.$Element#before
	@see nv.$Element#appendTo
	@see nv.$Element#prependTo
	@see nv.$Element#wrap
	@example
		// IDê°€ sample1ì¸ HTML ìš”ì†Œ ë’¤ì—
		// IDê°€ sample2ì¸ HTML ìš”ì†Œë¥¼ ì¶”ê°€ í•¨
		$Element("sample1").after("sample2");  // sample2ë¥¼ ëž˜í•‘í•œ $Element ë¥¼ ë°˜í™˜
		
		//Before
		<div id="sample1">
		    <div>Hello 1</div>
			<div id="sample2">
			    <div>Hello 2</div>
			</div>
		</div>
		
		//After
		<div id="sample1">
			<div>Hello 1</div>
		</div>
		<div id="sample2">
			<div>Hello 2</div>
		</div>
	@example
		// ìƒˆë¡œìš´ DIV ìš”ì†Œë¥¼ ì¶”ê°€
		var elNew = $("<div>Hello New</div>");
		$Element("sample").after(elNew); // elNew ìš”ì†Œë¥¼ ëž˜í•‘í•œ $Element ë¥¼ ë°˜í™˜
		
		//Before
		<div id="sample">
			<div>Hello</div>
		</div>
		
		//After
		<div id="sample">
			<div>Hello</div>
		</div>
		<div>Hello New</div>
 */
nv.$Element.prototype.after = function(oElement) {
    //-@@$Element.after-@@//
    oElement = nv.$Element._common(oElement,"after");
    this.before(oElement);
    nv.$Element(oElement).before(this);

    return this;
};
//-!nv.$Element.prototype.after end!-//

//-!nv.$Element.prototype.parent start!-//
/**
 	parent() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ìƒìœ„ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œë¥¼ ê²€ìƒ‰í•œë‹¤.
	
	@method parent
	@param {Function+} [fCallback] ìƒìœ„ ìš”ì†Œì˜ ê²€ìƒ‰ ì¡°ê±´ì„ ì§€ì •í•œ ì½œë°± í•¨ìˆ˜.<br>íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ ë¶€ëª¨ ìš”ì†Œë¥¼ ë°˜í™˜í•˜ê³ , íŒŒë¼ë¯¸í„°ë¡œ ì½œë°± í•¨ìˆ˜ë¥¼ ì§€ì •í•˜ë©´ ì½œë°± í•¨ìˆ˜ì˜ ì‹¤í–‰ ê²°ê³¼ê°€ trueë¥¼ ë°˜í™˜í•˜ëŠ” ìƒìœ„ ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤. ì´ë•Œ ì½œë°± í•¨ìˆ˜ëŠ” ê²°ê³¼ë¥¼ ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤. ì½œë°± í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¡œ íƒìƒ‰ ì¤‘ì¸ ìƒìœ„ ìš”ì†Œì˜ nv.$Element() ê°ì²´ê°€ ìž…ë ¥ëœë‹¤.
	@param {Numeric} [nLimit] íƒìƒ‰í•  ìƒìœ„ ìš”ì†Œì˜ ë ˆë²¨.<br>íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ ëª¨ë“  ìƒìœ„ ìš”ì†Œë¥¼ íƒìƒ‰í•œë‹¤. fCallback íŒŒë¼ë¯¸í„°ë¥¼ nullë¡œ ì„¤ì •í•˜ê³  nLimit íŒŒë¼ë¯¸í„°ë¥¼ ì„¤ì •í•˜ë©´ ì œí•œëœ ë ˆë²¨ì˜ ìƒìœ„ ìš”ì†Œë¥¼ ì¡°ê±´ì—†ì´ ê²€ìƒ‰í•œë‹¤.
	@return {Variant} ë¶€ëª¨ ìš”ì†Œê°€ ë‹´ê¸´ nv.$Element() ê°ì²´ í˜¹ì€ ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” ìƒìœ„ ìš”ì†Œì˜ ë°°ì—´(Array).<br>íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ì—¬ ë¶€ëª¨ ìš”ì†Œë¥¼ ë°˜í™˜í•˜ëŠ” ê²½ìš°, nv.$Element() ê°ì²´ë¡œ ë°˜í™˜í•˜ê³  ê·¸ ì´ì™¸ì—ëŠ” nv.$Element() ê°ì²´ë¥¼ ì›ì†Œë¡œ ê°–ëŠ” ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#child
	@see nv.$Element#prev
	@see nv.$Element#next
	@see nv.$Element#first
	@see nv.$Element#last
	@see nv.$Element#indexOf
	@example
		<div class="sample" id="div1">
			<div id="div2">
				<div class="sample" id="div3">
					<div id="target">
						Sample
						<div id="div4">
							Sample
						</div>
						<div class="sample" id="div5">
							Sample
						</div>
					</div>
					<div class="sample" id="div6">
						Sample
					</div>
				</div>
			</div>
		</div>
		
		<script type="text/javascript">
			var welTarget = $Element("target");
			var parent = welTarget.parent();
			// IDê°€ div3ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ë°˜í™˜
		
			parent = welTarget.parent(function(v){
			        return v.hasClass("sample");
			    });
			// IDê°€ div3ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementì™€
			// IDê°€ div1ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		
			parent = welTarget.parent(function(v){
			        return v.hasClass("sample");
			    }, 1);
			// IDê°€ div3ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.parent = function(pFunc, limit) {
    //-@@$Element.parent-@@//
    var oArgs = g_checkVarType(arguments, {
        '4voi' : [],
        '4fun' : [ 'fpFunc:Function+' ],
        '4nul' : [ 'fpFunc:Null' ],
        'for_function_number' : [ 'fpFunc:Function+', 'nLimit:Numeric'],
        'for_null_number' : [ 'fpFunc:Null', 'nLimit:Numeric' ]
    },"$Element#parent");
    
    var e = this._element;
    
    switch(oArgs+""){
        case "4voi":
            return e.parentNode?nv.$Element(e.parentNode):null;
        case "4fun":
        case "4nul":
             limit = -1;
             break;
        case "for_function_number":
        case "for_null_number":
            if(oArgs.nLimit==0)limit = -1; 
    }

    var a = [], p = null;

    while(e.parentNode && limit-- != 0) {
        try {
            p = nv.$Element(e.parentNode);
        } catch(err) {
            p = null;
        }

        if (e.parentNode == document.documentElement) break;
        if (!pFunc || (pFunc && pFunc.call(this,p))) a[a.length] = p;

        e = e.parentNode;
    }

    return a;
};
//-!nv.$Element.prototype.parent end!-//

//-!nv.$Element.prototype.child start!-//
/**
 	child() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ í•˜ìœ„ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œë¥¼ ê²€ìƒ‰í•œë‹¤.
	
	@method child
	@param {Function+} [fCallback] í•˜ìœ„ ìš”ì†Œì˜ ê²€ìƒ‰ ì¡°ê±´ì„ ì§€ì •í•œ ì½œë°± í•¨ìˆ˜.<br>íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ ìžì‹ ìš”ì†Œë¥¼ ë°˜í™˜í•˜ê³ , íŒŒë¼ë¯¸í„°ë¡œ ì½œë°± í•¨ìˆ˜ë¥¼ ì§€ì •í•˜ë©´ ì½œë°± í•¨ìˆ˜ì˜ ì‹¤í–‰ ê²°ê³¼ê°€ trueë¥¼ ë°˜í™˜í•˜ëŠ” í•˜ìœ„ ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤. ì´ë•Œ ì½œë°± í•¨ìˆ˜ëŠ” ê²°ê³¼ë¥¼ ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤. ì½œë°± í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¡œ íƒìƒ‰ ì¤‘ì¸ í•˜ìœ„ ìš”ì†Œì˜ nv.$Element() ê°ì²´ê°€ ìž…ë ¥ëœë‹¤.
	@param {Numeric} [nLimit] íƒìƒ‰í•  í•˜ìœ„ ìš”ì†Œì˜ ë ˆë²¨.<br>íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ ëª¨ë“  í•˜ìœ„ ìš”ì†Œë¥¼ íƒìƒ‰í•œë‹¤. fCallback íŒŒë¼ë¯¸í„°ë¥¼ nullë¡œ ì„¤ì •í•˜ê³  nLimit íŒŒë¼ë¯¸í„°ë¥¼ ì„¤ì •í•˜ë©´ ì œí•œëœ ë ˆë²¨ì˜ í•˜ìœ„ ìš”ì†Œë¥¼ ì¡°ê±´ì—†ì´ ê²€ìƒ‰í•œë‹¤.
	@return {Variant} ìžì‹ ìš”ì†Œê°€ ë‹´ê¸´ ë°°ì—´(Array) í˜¹ì€ ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” í•˜ìœ„ ìš”ì†Œì˜ ë°°ì—´(Array).<br>í•˜ë‚˜ì˜ í•˜ìœ„ ìš”ì†Œë¥¼ ë°˜í™˜í•  ë•ŒëŠ” nv.$Element() ê°ì²´ë¥¼ ë°˜í™˜í•˜ê³  ê·¸ ì´ì™¸ì—ëŠ” nv.$Element() ê°ì²´ë¥¼ ì›ì†Œë¡œ ê°–ëŠ” ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#parent
	@see nv.$Element#prev
	@see nv.$Element#next
	@see nv.$Element#first
	@see nv.$Element#last
	@see nv.$Element#indexOf
	@example
		<div class="sample" id="target">
			<div id="div1">
				<div class="sample" id="div2">
					<div id="div3">
						Sample
						<div id="div4">
							Sample
						</div>
						<div class="sample" id="div5">
							Sample
							<div class="sample" id="div6">
								Sample
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="sample" id="div7">
				Sample
			</div>
		</div>
		
		<script type="text/javascript">
			var welTarget = $Element("target");
			var child = welTarget.child();
			// IDê°€ div1ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementì™€
			// IDê°€ div7ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		
			child = welTarget.child(function(v){
			        return v.hasClass("sample");
			    });
			// IDê°€ div2ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementì™€
			// IDê°€ div5ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementì™€
			// IDê°€ div6ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementì™€
			// IDê°€ div7ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		
			child = welTarget.child(function(v){
			        return v.hasClass("sample");
			    }, 1);
			// IDê°€ div7ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		
			child = welTarget.child(function(v){
			        return v.hasClass("sample");
			    }, 2);
			// IDê°€ div2ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementì™€
			// IDê°€ div7ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.child = function(pFunc, limit) {
    //-@@$Element.child-@@//
    var oArgs = g_checkVarType(arguments, {
        '4voi' : [],
        '4fun' : [ 'fpFunc:Function+' ],
        '4nul' : [ 'fpFunc:Null' ],
        'for_function_number' : [ 'fpFunc:Function+', 'nLimit:Numeric'],
        'for_null_number' : [ 'fpFunc:Null', 'nLimit:Numeric' ]
    },"$Element#child");
    var e = this._element;
    var a = [], c = null, f = null;
    
    switch(oArgs+""){
        case "4voi":
            var child = e.childNodes;
            var filtered = [];

            for(var  i = 0, l = child.length; i < l; i++){
                if(child[i].nodeType == 1){
                    try {
                        filtered.push(nv.$Element(child[i]));
                    } catch(err) {
                        filtered.push(null);
                    }
                }
            }
            return filtered;
        case "4fun":
        case "4nul":
             limit = -1;
             break;
        case "for_function_number":
        case "for_null_number":
            if(oArgs.nLimit==0)limit = -1;
    }

    (f = function(el, lim, context) {
        var ch = null, o = null;

        for(var i=0; i < el.childNodes.length; i++) {
            ch = el.childNodes[i];
            if (ch.nodeType != 1) continue;
            try {
                o = nv.$Element(el.childNodes[i]);
            } catch(e) {
                o = null;
            }
            if (!pFunc || (pFunc && pFunc.call(context,o))) a[a.length] = o;
            if (lim != 0) f(el.childNodes[i], lim-1);
        }
    })(e, limit-1,this);

    return a;
};
//-!nv.$Element.prototype.child end!-//

//-!nv.$Element.prototype.prev start!-//
/**
 	prev() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ì´ì „ í˜•ì œ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œë¥¼ ê²€ìƒ‰í•œë‹¤.
	
	@method prev
	@param {Function+} [fCallback] ì´ì „ í˜•ì œ ìš”ì†Œì˜ ê²€ìƒ‰ ì¡°ê±´ì„ ì§€ì •í•œ ì½œë°± í•¨ìˆ˜.<br>íŒŒë¼ë¯¸í„°ë¡œ ì½œë°± í•¨ìˆ˜ë¥¼ ì§€ì •í•˜ë©´ ì½œë°± í•¨ìˆ˜ì˜ ì‹¤í–‰ ê²°ê³¼ê°€ trueë¥¼ ë°˜í™˜í•˜ëŠ” ì´ì „ í˜•ì œ ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤. ì´ë•Œ ì½œë°± í•¨ìˆ˜ëŠ” ê²°ê³¼ë¥¼ ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤. ì½œë°± í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¡œ íƒìƒ‰ ì¤‘ì¸ ì´ì „ í˜•ì œ ìš”ì†Œì˜ nv.$Element() ê°ì²´ê°€ ìž…ë ¥ëœë‹¤.
	@return {Variant} ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” ì´ì „ í˜•ì œ ìš”ì†Œ(nv.$Element() ê°ì²´)ë¥¼ ì›ì†Œë¡œ ê°–ëŠ” ë°°ì—´(Array).<br>fCallbackì´ nullì¸ ê²½ìš° ëª¨ë“  ì´ì „ í˜•ì œ ìš”ì†Œì˜ ë°°ì—´(Array)ì„ ë°˜í™˜í•œë‹¤. íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ ë°”ë¡œ ì´ì „ í˜•ì œ ìš”ì†Œê°€ ë‹´ê¸´ nv.$Element() ê°ì²´. ë§Œì•½ ì—˜ë¦¬ë¨¼íŠ¸ê°€ ì—†ìœ¼ë©´ nullì„ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#parent
	@see nv.$Element#child
	@see nv.$Element#next
	@see nv.$Element#first
	@see nv.$Element#last
	@see nv.$Element#indexOf
	@example
		<div class="sample" id="sample_div1">
			<div id="sample_div2">
				<div class="sample" id="sample_div3">
					Sample1
				</div>
				<div id="sample_div4">
					Sample2
				</div>
				<div class="sample" id="sample_div5">
					Sample3
				</div>
				<div id="sample_div">
					Sample4
					<div id="sample_div6">
						Sample5
					</div>
				</div>
				<div id="sample_div7">
					Sample6
				</div>
				<div class="sample" id="sample_div8">
					Sample7
				</div>
			</div>
		</div>
		
		<script type="text/javascript">
			var sibling = $Element("sample_div").prev();
			// IDê°€ sample_div5ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ë°˜í™˜
		
			sibling = $Element("sample_div").prev(function(v){
			    return $Element(v).hasClass("sample");
			});
			// IDê°€ sample_div5ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementì™€
			// IDê°€ sample_div3ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.prev = function(pFunc) {
    //-@@$Element.prev-@@//
    
    var oArgs = g_checkVarType(arguments, {
        '4voi' : [],
        '4fun' : [ 'fpFunc:Function+' ],
        '4nul' : [ 'fpFunc:Null' ]
    },"$Element#prev");
    
    var e = this._element;
    var a = [];
    
    switch(oArgs+""){
        case "4voi":
            if (!e) return null;
            do {
                
                e = e.previousSibling;
                if (!e || e.nodeType != 1) continue;
                try{
                    if(e==null) return null;
                    return nv.$Element(e);   
                }catch(e){
                    return null;
                }
            } while(e);
            try{
                if(e==null) return null;
                return nv.$Element(e);   
            }catch(e){
                return null;
            }
            // 'break' statement was intentionally omitted.
        case "4fun":
        case "4nul":
            if (!e) return a;
            do {
                e = e.previousSibling;
                
                if (!e || e.nodeType != 1) continue;
                if (!pFunc||pFunc.call(this,e)) {
                    
                    try{
                        if(e==null) a[a.length]=null;
                        else a[a.length] = nv.$Element(e);
                    }catch(e){
                        a[a.length] = null;
                    }
                     
                }
            } while(e);
            try{
                return a;   
            }catch(e){
                return null;
            }
    }
};
//-!nv.$Element.prototype.prev end!-//

//-!nv.$Element.prototype.next start!-//
/**
 	next() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ë‹¤ìŒ í˜•ì œ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œë¥¼ ê²€ìƒ‰í•œë‹¤.
	
	@method next
	@param {Function+} [fCallback] ë‹¤ìŒ í˜•ì œ ìš”ì†Œì˜ ê²€ìƒ‰ ì¡°ê±´ì„ ì§€ì •í•œ ì½œë°± í•¨ìˆ˜.<br>íŒŒë¼ë¯¸í„°ë¡œ ì½œë°± í•¨ìˆ˜ë¥¼ ì§€ì •í•˜ë©´ ì½œë°± í•¨ìˆ˜ì˜ ì‹¤í–‰ ê²°ê³¼ê°€ trueë¥¼ ë°˜í™˜í•˜ëŠ” ë‹¤ìŒ í˜•ì œ ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤. ì´ë•Œ ì½œë°± í•¨ìˆ˜ëŠ” ê²°ê³¼ë¥¼ ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤. ì½œë°± í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¡œ íƒìƒ‰ ì¤‘ì¸ ë‹¤ìŒ í˜•ì œ ìš”ì†Œì˜ nv.$Element() ê°ì²´ê°€ ìž…ë ¥ëœë‹¤.
	@return {Variant} ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” ë‹¤ìŒ í˜•ì œ ìš”ì†Œ(nv.$Element() ê°ì²´)ë¥¼ ì›ì†Œë¡œ ê°–ëŠ” ë°°ì—´(Array).<br>fCallbackì´ nullì¸ ê²½ìš° ëª¨ë“  ë‹¤ìŒ í˜•ì œ ìš”ì†Œì˜ ë°°ì—´(Array)ì„ ë°˜í™˜í•œë‹¤. íŒŒë¼ë¯¸í„°ë¥¼ ìƒëžµí•˜ë©´ ë°”ë¡œ ë‹¤ìŒ í˜•ì œ ìš”ì†Œê°€ ë‹´ê¸´ nv.$Element() ê°ì²´. ë§Œì•½ ì—˜ë¦¬ë¨¼íŠ¸ê°€ ì—†ìœ¼ë©´ nullì„ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#parent
	@see nv.$Element#child
	@see nv.$Element#prev
	@see nv.$Element#first
	@see nv.$Element#last
	@see nv.$Element#indexOf
	@example
		<div class="sample" id="sample_div1">
			<div id="sample_div2">
				<div class="sample" id="sample_div3">
					Sample1
				</div>
				<div id="sample_div4">
					Sample2
				</div>
				<div class="sample" id="sample_div5">
					Sample3
				</div>
				<div id="sample_div">
					Sample4
					<div id="sample_div6">
						Sample5
					</div>
				</div>
				<div id="sample_div7">
					Sample6
				</div>
				<div class="sample" id="sample_div8">
					Sample7
				</div>
			</div>
		</div>
		
		<script type="text/javascript">
			var sibling = $Element("sample_div").next();
			// IDê°€ sample_div7ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ë°˜í™˜
		
			sibling = $Element("sample_div").next(function(v){
			    return $Element(v).hasClass("sample");
			});
			// IDê°€ sample_div8ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.next = function(pFunc) {
    //-@@$Element.next-@@//
    var oArgs = g_checkVarType(arguments, {
        '4voi' : [],
        '4fun' : [ 'fpFunc:Function+' ],
        '4nul' : [ 'fpFunc:Null' ]
    },"$Element#next");
    var e = this._element;
    var a = [];
    
    switch(oArgs+""){
        case "4voi":
            if (!e) return null;
            do {
                e = e.nextSibling;
                if (!e || e.nodeType != 1) continue;
                try{
                    if(e==null) return null;
                    return nv.$Element(e);   
                }catch(e){
                    return null;
                }
            } while(e);
            try{
                if(e==null) return null;
                return nv.$Element(e);   
            }catch(e){
                return null;
            }
            // 'break' statement was intentionally omitted.
        case "4fun":
        case "4nul":
            if (!e) return a;
            do {
                e = e.nextSibling;
                
                if (!e || e.nodeType != 1) continue;
                if (!pFunc||pFunc.call(this,e)) {
                    
                    try{
                        if(e==null) a[a.length] = null;
                        else a[a.length] = nv.$Element(e);
                    }catch(e){
                        a[a.length] = null;
                    }
                     
                }
            } while(e);
            try{
                return a;   
            }catch(e){
                return null;
            }
            
    }
};
//-!nv.$Element.prototype.next end!-//

//-!nv.$Element.prototype.first start!-//
/**
 	first() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method first
	@return {nv.$Element} ì²« ë²ˆì§¸ ìžì‹ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œ. ë§Œì•½ ì—˜ë¦¬ë¨¼íŠ¸ê°€ ì—†ìœ¼ë©´ nullì„ ë°˜í™˜.
	@since 1.2.0
	@see nv.$Element#parent
	@see nv.$Element#child
	@see nv.$Element#prev
	@see nv.$Element#next
	@see nv.$Element#last
	@see nv.$Element#indexOf
	@example
		<div id="sample_div1">
			<div id="sample_div2">
				<div id="sample_div">
					Sample1
					<div id="sample_div3">
						<div id="sample_div4">
							Sample2
						</div>
						Sample3
					</div>
					<div id="sample_div5">
						Sample4
						<div id="sample_div6">
							Sample5
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<script type="text/javascript">
			var firstChild = $Element("sample_div").first();
			// IDê°€ sample_div3ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.first = function() {
    //-@@$Element.first-@@//
    var el = this._element.firstElementChild||this._element.firstChild;
    if (!el) return null;
    while(el && el.nodeType != 1) el = el.nextSibling;
    try{
        return el?nv.$Element(el):null;
    }catch(e){
        return null;
    }
};
//-!nv.$Element.prototype.first end!-//

//-!nv.$Element.prototype.last start!-//
/**
 	last() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ë§ˆì§€ë§‰ ìžì‹ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method last
	@return {nv.$Element} ë§ˆì§€ë§‰ ìžì‹ ë…¸ë“œì— í•´ë‹¹í•˜ëŠ” ìš”ì†Œ. ë§Œì•½ ì—˜ë¦¬ë¨¼íŠ¸ê°€ ì—†ìœ¼ë©´ nullì„ ë°˜í™˜.
	@since 1.2.0
	@see nv.$Element#parent
	@see nv.$Element#child
	@see nv.$Element#prev
	@see nv.$Element#next
	@see nv.$Element#first
	@see nv.$Element#indexOf
	@example
		<div id="sample_div1">
			<div id="sample_div2">
				<div id="sample_div">
					Sample1
					<div id="sample_div3">
						<div id="sample_div4">
							Sample2
						</div>
						Sample3
					</div>
					<div id="sample_div5">
						Sample4
						<div id="sample_div6">
							Sample5
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<script type="text/javascript">
			var lastChild = $Element("sample_div").last();
			// IDê°€ sample_div5ì¸ DIVë¥¼ ëž˜í•‘í•œ $Elementë¥¼ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.last = function() {
    //-@@$Element.last-@@//
    var el = this._element.lastElementChild||this._element.lastChild;
    if (!el) return null;
    while(el && el.nodeType != 1) el = el.previousSibling;

    try{
        return el?nv.$Element(el):null;
    }catch(e){
        return null;
    }
};
//-!nv.$Element.prototype.last end!-//

//-!nv.$Element._contain.hidden start!-//
/**
 	isChildOf , isParentOfì˜ ê¸°ë³¸ì´ ë˜ëŠ” API (IEì—ì„œëŠ” contains,ê¸°íƒ€ ë¸Œë¼ìš°ì ¸ì—ëŠ” compareDocumentPositionì„ ì‚¬ìš©í•˜ê³  ë‘˜ë‹¤ ì—†ëŠ” ê²½ìš°ëŠ” ê¸°ì¡´ ë ˆê±°ì‹œ APIì‚¬ìš©.)
	
	@method _contain
	@param {HTMLElement} eParent	ë¶€ëª¨ë…¸ë“œ
	@param {HTMLElement} eChild	ìžì‹ë…¸ë“œ
	@ignore
 */
nv.$Element._contain = function(eParent,eChild){
    if (document.compareDocumentPosition) {
        return !!(eParent.compareDocumentPosition(eChild)&16);
    }else if(eParent.contains){
        return (eParent !== eChild)&&(eParent.contains ? eParent.contains(eChild) : true);
    }else if(document.body.contains){
        if(eParent===(eChild.ownerDocument || eChild.document)&&eChild.tagName&&eChild.tagName.toUpperCase()==="BODY"){ return true;}  // when find body in document
        if(eParent.nodeType === 9&&eParent!==eChild){
            eParent = eParent.body; 
        }
        try{
            return (eParent !== eChild)&&(eParent.contains ? eParent.contains(eChild) : true);
        }catch(e){
            return false;
        }
    }else{
        var e  = eParent;
        var el = eChild;

        while(e && e.parentNode) {
            e = e.parentNode;
            if (e == el) return true;
        }
        return false;
    }
};
//-!nv.$Element._contain.hidden end!-//

//-!nv.$Element.prototype.isChildOf start(nv.$Element._contain)!-//
/**
 	isChildOf() ë©”ì„œë“œëŠ” íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œê°€ HTML ìš”ì†Œì˜ ë¶€ëª¨ ë…¸ë“œì¸ì§€ ê²€ì‚¬í•œë‹¤.
	
	@method isChildOf
	@syntax sElement
	@syntax elElement
	@param {String+} sElement ë¶€ëª¨ ë…¸ë“œì¸ì§€ ê²€ì‚¬í•  HTML ìš”ì†Œì˜ ID
	@param {Element+} elElement ë¶€ëª¨ ë…¸ë“œì¸ì§€ ê²€ì‚¬í•  HTML ìš”ì†Œ
	@return {Boolean} ì§€ì •í•œ ìš”ì†Œê°€ ë¶€ëª¨ ìš”ì†Œì´ë©´ true, ê·¸ë ‡ì§€ ì•Šìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#isParentOf
	@example
		<div id="parent">
			<div id="child">
				<div id="grandchild"></div>
			</div>
		</div>
		<div id="others"></div>
		
		// ë¶€ëª¨/ìžì‹ í™•ì¸í•˜ê¸°
		$Element("child").isChildOf("parent");		// ê²°ê³¼ : true
		$Element("others").isChildOf("parent");		// ê²°ê³¼ : false
		$Element("grandchild").isChildOf("parent");	// ê²°ê³¼ : true
 */
nv.$Element.prototype.isChildOf = function(element) {
    //-@@$Element.isChildOf-@@//
    try{
        return nv.$Element._contain(nv.$Element(element)._element,this._element);
    }catch(e){
        return false;
    }
};
//-!nv.$Element.prototype.isChildOf end!-//

//-!nv.$Element.prototype.isParentOf start(nv.$Element._contain)!-//
/**
 	isParentOf() ë©”ì„œë“œëŠ” íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œê°€ HTML ìš”ì†Œì˜ ìžì‹ ë…¸ë“œì¸ì§€ ê²€ì‚¬í•œë‹¤.
	
	@method isParentOf
	@syntax sElement
	@syntax elElement
	@param {String+} sElement ìžì‹ ë…¸ë“œì¸ì§€ ê²€ì‚¬í•  HTML ìš”ì†Œì˜ ID
	@param {Element+} elElement ìžì‹ ë…¸ë“œì¸ì§€ ê²€ì‚¬í•  HTML ìš”ì†Œ
	@return {Boolean} ì§€ì •í•œ ìš”ì†Œê°€ ìžì‹ ìš”ì†Œì´ë©´ true, ê·¸ë ‡ì§€ ì•Šìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#isChildOf
	@example
		<div id="parent">
			<div id="child"></div>
		</div>
		<div id="others"></div>
		
		// ë¶€ëª¨/ìžì‹ í™•ì¸í•˜ê¸°
		$Element("parent").isParentOf("child");		// ê²°ê³¼ : true
		$Element("others").isParentOf("child");		// ê²°ê³¼ : false
		$Element("parent").isParentOf("grandchild");// ê²°ê³¼ : true
 */
nv.$Element.prototype.isParentOf = function(element) {
    //-@@$Element.isParentOf-@@//
    try{
        return nv.$Element._contain(this._element, nv.$Element(element)._element);
    }catch(e){
        return false;
    }
};
//-!nv.$Element.prototype.isParentOf end!-//

//-!nv.$Element.prototype.isEqual start!-//
/**
 	isEqual() ë©”ì„œë“œëŠ” íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œê°€ HTML ìš”ì†Œì™€ ê°™ì€ ìš”ì†Œì¸ì§€ ê²€ì‚¬í•œë‹¤.
	
	@method isEqual
	@syntax sElement
	@syntax vElement
	@param {String+} sElement ê°™ì€ ìš”ì†Œì¸ì§€ ë¹„êµí•  HTML ìš”ì†Œì˜ ID.
	@param {Element+} vElement ê°™ì€ ìš”ì†Œì¸ì§€ ë¹„êµí•  HTML ìš”ì†Œ.
	@return {Boolean} ì§€ì •í•œ ìš”ì†Œì™€ ê°™ì€ ìš”ì†Œì´ë©´ true, ê·¸ë ‡ì§€ ì•Šìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@remark 
		<ul class="disc">
			<li>DOM Level 3 ëª…ì„¸ì˜ API ì¤‘ isSameNode í•¨ìˆ˜ì™€ ê°™ì€ ë©”ì„œë“œë¡œ ë ˆí¼ëŸ°ìŠ¤ê¹Œì§€ í™•ì¸í•œë‹¤.</li>
			<li>isEqualNode() ë©”ì„œë“œì™€ëŠ” ë‹¤ë¥¸ í•¨ìˆ˜ì´ê¸° ë•Œë¬¸ì— ì£¼ì˜í•œë‹¤.</li>
		</ul>
	@see http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-isSameNode isSameNode - W3C DOM Level 3 Specification
	@see nv.$Element#isEqualnode
	@example
		<div id="sample1"><span>Sample</span></div>
		<div id="sample2"><span>Sample</span></div>
		
		// ê°™ì€ HTML ìš”ì†Œì¸ì§€ í™•ì¸
		var welSpan1 = $Element("sample1").first();	// <span>Sample</span>
		var welSpan2 = $Element("sample2").first();	// <span>Sample</span>
		
		welSpan1.isEqual(welSpan2); // ê²°ê³¼ : false
		welSpan1.isEqual(welSpan1); // ê²°ê³¼ : true
 */
nv.$Element.prototype.isEqual = function(element) {
    //-@@$Element.isEqual-@@//
    try {
        return (this._element === nv.$Element(element)._element);
    } catch(e) {
        return false;
    }
};
//-!nv.$Element.prototype.isEqual end!-//

//-!nv.$Element.prototype.fireEvent start!-//
/**
 	fireEvent() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì— ì´ë²¤íŠ¸ë¥¼ ë°œìƒì‹œí‚¨ë‹¤. íŒŒë¼ë¯¸í„°ë¡œ ë°œìƒì‹œí‚¬ ì´ë²¤íŠ¸ ì¢…ë¥˜ì™€ ì´ë²¤íŠ¸ ê°ì²´ì˜ ì†ì„±ì„ ì§€ì •í•  ìˆ˜ ìžˆë‹¤.
	
	@method fireEvent
	@param {String+} sEvent ë°œìƒì‹œí‚¬ ì´ë²¤íŠ¸ ì´ë¦„. on ì ‘ë‘ì‚¬ëŠ” ìƒëžµí•œë‹¤.
	@param {Hash+} [oProps] ì´ë²¤íŠ¸ ê°ì²´ì˜ ì†ì„±ì„ ì§€ì •í•œ ê°ì²´. ì´ë²¤íŠ¸ë¥¼ ë°œìƒì‹œí‚¬ ë•Œ ì†ì„±ì„ ì„¤ì •í•  ìˆ˜ ìžˆë‹¤.
	@return {nv.$Element} ì´ë²¤íŠ¸ê°€ ë°œìƒí•œ HTML ìš”ì†Œì˜ nv.$Element() ê°ì²´.
	@remark 
		<ul class="disc">
			<li>1.4.1 ë²„ì „ë¶€í„° keyCode ê°’ì„ ì„¤ì •í•  ìˆ˜ ìžˆë‹¤.</li>
			<li>WebKit ê³„ì—´ì—ì„œëŠ” ì´ë²¤íŠ¸ ê°ì²´ì˜ keyCodeê°€ ì½ê¸° ì „ìš©(read-only)ì¸ ê´€ê³„ë¡œ key ì´ë²¤íŠ¸ë¥¼ ë°œìƒì‹œí‚¬ ê²½ìš° keyCode ê°’ì„ ì„¤ì •í•  ìˆ˜ ì—†ì—ˆë‹¤.</li>
		</ul>
	@example
		// click ì´ë²¤íŠ¸ ë°œìƒ
		$Element("div").fireEvent("click", {left : true, middle : false, right : false});
		
		// mouseover ì´ë²¤íŠ¸ ë°œìƒ
		$Element("div").fireEvent("mouseover", {screenX : 50, screenY : 50, clientX : 50, clientY : 50});
		
		// keydown ì´ë²¤íŠ¸ ë°œìƒ
		$Element("div").fireEvent("keydown", {keyCode : 13, alt : true, shift : false ,meta : false, ctrl : true});
 */
nv.$Element.prototype.fireEvent = function(sEvent, oProps) {
    //-@@$Element.fireEvent-@@//
    var _oParam = {
            '4str' : [ nv.$Jindo._F('sEvent:String+') ],
            '4obj' : [ 'sEvent:String+', 'oProps:Hash+' ]
    };
    
    nv._p_.fireCustomEvent = function (ele, sEvent,self,bIsNormalType){
        var oInfo = nv._p_.normalCustomEvent[sEvent];
        var targetEle,oEvent;
        for(var i in oInfo){
            oEvent = oInfo[i];
            targetEle = oEvent.ele;
            var wrap_listener;
            for(var sCssquery in oEvent){
                if(sCssquery==="_NONE_"){
                    if(targetEle==ele || self.isChildOf(targetEle)){
                        wrap_listener = oEvent[sCssquery].wrap_listener;
                        for(var k = 0, l = wrap_listener.length; k < l;k++){
                            wrap_listener[k]();
                        }
                    }
                }else{
                    if(nv.$Element.eventManager.containsElement(targetEle, ele, sCssquery,false)){
                        wrap_listener = oEvent[sCssquery].wrap_listener;
                        for(var k = 0, l = wrap_listener.length; k < l;k++){
                            wrap_listener[k]();
                        }
                    }
                }
            }
        }
        
    };

    function IE(sEvent, oProps) {
        var oArgs = g_checkVarType(arguments, _oParam,"$Element#fireEvent");
        var ele = this._element;
        
        if(nv._p_.normalCustomEvent[sEvent]){
            nv._p_.fireCustomEvent(ele,sEvent,this,!!nv._p_.normalCustomEvent[sEvent]);
            return this;
        }
    
        sEvent = (sEvent+"").toLowerCase();
        var oEvent = document.createEventObject();
        
        switch(oArgs+""){
            case "4obj":
                oProps = oArgs.oProps;
                for (var k in oProps){
                    if(oProps.hasOwnProperty(k))
                        oEvent[k] = oProps[k];
                } 
                oEvent.button = (oProps.left?1:0)+(oProps.middle?4:0)+(oProps.right?2:0);
                oEvent.relatedTarget = oProps.relatedElement||null;
                
        }

        if(this.tag == "input" && sEvent == "click"){ 
            if(ele.type=="checkbox"){ 
                ele.checked = (!ele.checked); 
            }else if(ele.type=="radio"){ 
                ele.checked = true; 
            } 
        } 
                
        this._element.fireEvent("on"+sEvent, oEvent);
        return this;
    }

    function DOM2(sEvent, oProps) {
        var oArgs = g_checkVarType(arguments, _oParam,"$Element#fireEvent");
        var ele = this._element;
        
        var oldEvent = sEvent;
        sEvent = nv.$Element.eventManager.revisionEvent("",sEvent,sEvent);
        if(nv._p_.normalCustomEvent[sEvent]){
            nv._p_.fireCustomEvent(ele,sEvent,this,!!nv._p_.normalCustomEvent[sEvent]);
            return this;
        }
        
        var sType = "HTMLEvents";
        sEvent = (sEvent+"").toLowerCase();
        

        if (sEvent == "click" || sEvent.indexOf("mouse") == 0) {
            sType = "MouseEvent";
        } else if(oldEvent.indexOf("wheel") > 0){
           sEvent = "DOMMouseScroll"; 
           sType = nv._p_._JINDO_IS_FF?"MouseEvent":"MouseWheelEvent";  
        } else if (sEvent.indexOf("key") == 0) {
            sType = "KeyboardEvent";
        } else if (sEvent.indexOf("pointer") > 0) {
            sType = "MouseEvent";
            sEvent = oldEvent;
        }
        
        var evt;
        switch (oArgs+"") {
            case "4obj":
                oProps = oArgs.oProps;
                oProps.button = 0 + (oProps.middle?1:0) + (oProps.right?2:0);
                oProps.ctrl = oProps.ctrl||false;
                oProps.alt = oProps.alt||false;
                oProps.shift = oProps.shift||false;
                oProps.meta = oProps.meta||false;
                switch (sType) {
                    case 'MouseEvent':
                        evt = document.createEvent(sType);
    
                        evt.initMouseEvent( sEvent, true, true, null, oProps.detail||0, oProps.screenX||0, oProps.screenY||0, oProps.clientX||0, oProps.clientY||0, 
                                            oProps.ctrl, oProps.alt, oProps.shift, oProps.meta, oProps.button, oProps.relatedElement||null);
                        break;
                    case 'KeyboardEvent':
                        if (window.KeyEvent) {
                            evt = document.createEvent('KeyEvents');
                            evt.initKeyEvent(sEvent, true, true, window,  oProps.ctrl, oProps.alt, oProps.shift, oProps.meta, oProps.keyCode, oProps.keyCode);
                        } else {
                            try {
                                evt = document.createEvent("Events");
                            } catch (e){
                                evt = document.createEvent("UIEvents");
                            } finally {
                                evt.initEvent(sEvent, true, true);
                                evt.ctrlKey  = oProps.ctrl;
                                evt.altKey   = oProps.alt;
                                evt.shiftKey = oProps.shift;
                                evt.metaKey  = oProps.meta;
                                evt.keyCode = oProps.keyCode;
                                evt.which = oProps.keyCode;
                            }          
                        }
                        break;
                    default:
                        evt = document.createEvent(sType);
                        evt.initEvent(sEvent, true, true);              
                }
            break;
            case "4str":
                evt = document.createEvent(sType);          
                evt.initEvent(sEvent, true, true);
            
        }
        ele.dispatchEvent(evt);
        return this;
    }
    nv.$Element.prototype.fireEvent =  (document.dispatchEvent !== undefined)?DOM2:IE;
    return this.fireEvent.apply(this,nv._p_._toArray(arguments));
};
//-!nv.$Element.prototype.fireEvent end!-//

//-!nv.$Element.prototype.empty start(nv.$Element.prototype.html)!-//
/**
 	empty() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ ìžì‹ ìš”ì†Œì™€ ê·¸ ìžì‹ ìš”ì†Œë“¤ì— ë“±ë¡ëœ ëª¨ë“  ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ê¹Œì§€ ì œê±°í•œë‹¤.
	
	@method empty
	@return {this} ìžì‹ ë…¸ë“œë¥¼ ëª¨ë‘ ì œê±°í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#leave
	@see nv.$Element#remove
	@example
		// ìžì‹ ë…¸ë“œë¥¼ ëª¨ë‘ ì œê±°
		$Element("sample").empty();
		
		//Before
		<div id="sample"><span>ë…¸ë“œ</span> <span>ëª¨ë‘</span> ì‚­ì œí•˜ê¸° </div>
		
		//After
		<div id="sample"></div>
 */
nv.$Element.prototype.empty = function() {
    //-@@$Element.empty-@@//
    if(nv.cssquery) nv.cssquery.release();
    this.html("");
    return this;
};
//-!nv.$Element.prototype.empty end!-//

//-!nv.$Element.prototype.remove start(nv.$Element.prototype.leave, nv.$Element._common)!-//
/**
 	remove() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ íŠ¹ì • ìžì‹ ë…¸ë“œë¥¼ ì œê±°í•œë‹¤. íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìžì‹ ìš”ì†Œë¥¼ ì œê±°í•˜ë©° ì œê±°ë˜ëŠ” ìžì‹ ìš”ì†Œì˜ ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ì™€ ê·¸ ìžì‹ ìš”ì†Œì˜ ëª¨ë“  í•˜ìœ„ ìš”ì†Œì˜ ëª¨ë“  ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ë„ ì œê±°í•œë‹¤.
	
	@method remove
	@syntax sElement
	@syntax vElement
	@param {String+} sElement ìžì‹ ìš”ì†Œì—ì„œ ì œê±°í•  HTML ìš”ì†Œì˜ ID.
	@param {Element+} vElement ìžì‹ ìš”ì†Œì—ì„œ ì œê±°í•  HTML ìš”ì†Œ.
	@return {this} ì§€ì •í•œ ìžì‹ ë…¸ë“œë¥¼ ì œê±°í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#empty
	@see nv.$Element#leave
	@example
		// íŠ¹ì • ìžì‹ ë…¸ë“œë¥¼ ì œê±°
		$Element("sample").remove("child2");
		
		//Before
		<div id="sample"><span id="child1">ë…¸ë“œ</span> <span id="child2">ì‚­ì œí•˜ê¸°</span></div>
		
		//After
		<div id="sample"><span id="child1">ë…¸ë“œ</span> </div>
 */
nv.$Element.prototype.remove = function(oChild) {
    //-@@$Element.remove-@@//
    if(nv.cssquery) nv.cssquery.release();
    var ___element = nv.$Element;
    ___element(___element._common(oChild,"remove")).leave();
    return this;
};
//-!nv.$Element.prototype.remove end!-//

//-!nv.$Element.prototype.leave start(nv.$Element.event_etc)!-//
/**
 	leave() ë©”ì„œë“œëŠ” HTML ìš”ì†Œë¥¼ ìžì‹ ì˜ ë¶€ëª¨ ìš”ì†Œì—ì„œ ì œê±°í•œë‹¤. HTML ìš”ì†Œì— ë“±ë¡ëœ ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬, ê·¸ë¦¬ê³  ê·¸ ìš”ì†Œì˜ ëª¨ë“  ìžì‹ìš”ì†Œì˜ ëª¨ë“  ì´ë²¤íŠ¸ í•¸ë“¤ëŸ¬ë„ ì œê±°í•œë‹¤.
	
	@method leave
	@return {this} ë¶€ëª¨ ìš”ì†Œì—ì„œ ì œê±°ëœ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#empty
	@see nv.$Element#remove
	@example
		// ë¶€ëª¨ ìš”ì†Œ ë…¸ë“œì—ì„œ ì œê±°
		$Element("sample").leave();
		
		//Before
		<div>
			<div id="sample"><span>ë…¸ë“œ</span> <span>ëª¨ë‘</span> ì‚­ì œí•˜ê¸° </div>
		</div>
		
		//After : <div id="sample"><span>ë…¸ë“œ</span> <span>ëª¨ë‘</span> ì‚­ì œí•˜ê¸° </div>ë¥¼ ëž˜í•‘í•œ $Elementê°€ ë°˜í™˜ëœë‹¤
		<div>
		
		</div>
 */
nv.$Element.prototype.leave = function() {
    //-@@$Element.leave-@@//
    var e = this._element;
    
    if(e.parentNode){
        if(nv.cssquery) nv.cssquery.release();
        e.parentNode.removeChild(e);
    }
    
    /*if(this._element.__nv__id){
        nv.$Element.eventManager.cleanUpUsingKey(this._element.__nv__id, true);
    }

    nv._p_.releaseEventHandlerForAllChildren(this);*/
    
    return this;
};
//-!nv.$Element.prototype.leave end!-//

//-!nv.$Element.prototype.wrap start(nv.$Element._common)!-//
/**
 	wrap() ë©”ì„œë“œëŠ” HTML ìš”ì†Œë¥¼ ì§€ì •í•œ ìš”ì†Œë¡œ ê°ì‹¼ë‹¤. HTML ìš”ì†ŒëŠ” ì§€ì •í•œ ìš”ì†Œì˜ ë§ˆì§€ë§‰ ìžì‹ ìš”ì†Œê°€ ëœë‹¤.
	
	@method wrap
	@syntax sElement
	@syntax vElement
	@param {String+} sElement ë¶€ëª¨ê°€ ë  HTML ìš”ì†Œì˜ ID.
	@param {Element+ | Node} vElement ë¶€ëª¨ê°€ ë  HTML ìš”ì†Œ.
	@return {nv.$Element} ì§€ì •í•œ ìš”ì†Œë¡œ ê°ì‹¸ì§„ nv.$Element() ê°ì²´.
	@example
		$Element("sample1").wrap("sample2");
		
		//Before
		<div id="sample1"><span>Sample</span></div>
		<div id="sample2"><span>Sample</span></div>
		
		//After
		<div id="sample2"><span>Sample</span><div id="sample1"><span>Sample</span></div></div>
	@example
		$Element("box").wrap($('<DIV>'));
		
		//Before
		<span id="box"></span>
		
		//After
		<div><span id="box"></span></div>
 */
nv.$Element.prototype.wrap = function(wrapper) {
    //-@@$Element.wrap-@@//
    var e = this._element;
    wrapper = nv.$Element._common(wrapper,"wrap");
    if (e.parentNode) {
        e.parentNode.insertBefore(wrapper, e);
    }
    wrapper.appendChild(e);

    return this;
};
//-!nv.$Element.prototype.wrap end!-//

//-!nv.$Element.prototype.ellipsis start(nv.$Element.prototype._getCss,nv.$Element.prototype.text)!-//
/**
 	ellipsis() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì˜ í…ìŠ¤íŠ¸ ë…¸ë“œê°€ ë¸Œë¼ìš°ì €ì—ì„œ í•œ ì¤„ë¡œ ë³´ì´ë„ë¡ ê¸¸ì´ë¥¼ ì¡°ì ˆí•œë‹¤.
	
	@method ellipsis
	@param {String+} [sTail="..."] ë§ì¤„ìž„ í‘œì‹œìž. íŒŒë¼ë¯¸í„°ì— ì§€ì •í•œ ë¬¸ìžì—´ì„ í…ìŠ¤íŠ¸ ë…¸ë“œ ëì— ë¶™ì´ê³  í…ìŠ¤íŠ¸ ë…¸ë“œì˜ ê¸¸ì´ë¥¼ ì¡°ì ˆí•œë‹¤.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 
		<ul class="disc">
			<li>ì´ ë©”ì„œë“œëŠ” HTML ìš”ì†Œê°€ í…ìŠ¤íŠ¸ ë…¸ë“œë§Œì„ í¬í•¨í•œë‹¤ê³  ê°€ì •í•˜ê³  ë™ìž‘í•œë‹¤. ë”°ë¼ì„œ, ì´ ì™¸ì˜ ìƒí™©ì—ì„œëŠ” ì‚¬ìš©ì„ ìžì œí•œë‹¤.</li>
			<li>ë¸Œë¼ìš°ì €ì—ì„œ HTML ìš”ì†Œì˜ ë„ˆë¹„ë¥¼ ê¸°ì¤€ìœ¼ë¡œ í…ìŠ¤íŠ¸ ë…¸ë“œì˜ ê¸¸ì´ë¥¼ ì •í•˜ë¯€ë¡œ HTML ìš”ì†ŒëŠ” ë°˜ë“œì‹œ ë³´ì´ëŠ” ìƒíƒœ(display)ì—¬ì•¼ í•œë‹¤. í™”ë©´ì— ì „ì²´ í…ìŠ¤íŠ¸ ë…¸ë“œê°€ ë³´ì˜€ë‹¤ê°€ ì¤„ì–´ë“œëŠ” ê²½ìš°ê°€ ìžˆë‹¤. ì´ ê²½ìš°, HTML ìš”ì†Œì— overflow ì†ì„±ì˜ ê°’ì„ hiddenìœ¼ë¡œ ì§€ì •í•˜ë©´ í•´ê²°í•  ìˆ˜ ìžˆë‹¤.</li>
		</ul>
	@example
		$Element("sample_span").ellipsis();
		
		//Before
		<div style="width:300px; border:1px solid #ccc padding:10px">
			<span id="sample_span">NHNì€ ê²€ìƒ‰ê³¼ ê²Œìž„ì„ ì–‘ì¶•ìœ¼ë¡œ í˜ì‹ ì ì´ê³  íŽ¸ë¦¬í•œ ì˜¨ë¼ì¸ ì„œë¹„ìŠ¤ë¥¼ ê¾¸ì¤€ížˆ ì„ ë³´ì´ë©° ë””ì§€í„¸ ë¼ì´í”„ë¥¼ ì„ ë„í•˜ê³  ìžˆìŠµë‹ˆë‹¤.</span>
		</div>
		
		//After
		<div style="width:300px; border:1px solid #ccc; padding:10px">
			<span id="sample_span">NHNì€ ê²€ìƒ‰ê³¼ ê²Œìž„ì„ ì–‘ì¶•ìœ¼ë¡œ í˜ì‹ ì ...</span>
		</div> 
 */
nv.$Element.prototype.ellipsis = function(stringTail) {
    //-@@$Element.ellipsis-@@//
    
    var oArgs = g_checkVarType(arguments, {
        '4voi' : [ ],
        '4str' : [ 'stringTail:String+' ]
    },"$Element#ellipsis");
    
    stringTail = stringTail || "...";
    var txt   = this.text();
    var len   = txt.length;
    var padding = parseInt(this._getCss(this._element,"paddingTop"),10) + parseInt(this._getCss(this._element,"paddingBottom"),10);
    var cur_h = this._element.offsetHeight - padding;
    var i     = 0;
    var h     = this.text('A')._element.offsetHeight - padding;

    if (cur_h < h * 1.5) {
        this.text(txt);
        return this;
    }

    cur_h = h;
    while(cur_h < h * 1.5) {
        i += Math.max(Math.ceil((len - i)/2), 1);
        cur_h = this.text(txt.substring(0,i)+stringTail)._element.offsetHeight - padding;
    }

    while(cur_h > h * 1.5) {
        i--;
        cur_h = this.text(txt.substring(0,i)+stringTail)._element.offsetHeight - padding;
    }
    return this;
};
//-!nv.$Element.prototype.ellipsis end!-//

//-!nv.$Element.prototype.indexOf start!-//
/**
 	indexOf() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì—ì„œ íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ ìš”ì†Œê°€ ëª‡ ë²ˆì§¸ ìžì‹ì¸ì§€ í™•ì¸í•˜ì—¬ ì¸ë±ìŠ¤ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method indexOf
	@syntax sElement
	@syntax vElement
	@param {String+} sElement ëª‡ ë²ˆì§¸ ìžì‹ì¸ì§€ ê²€ìƒ‰í•  ìš”ì†Œì˜ ID
	@param {Element+} vElement ëª‡ ë²ˆì§¸ ìžì‹ì¸ì§€ ê²€ìƒ‰í•  ìš”ì†Œ.
	@return {Numeric} ê²€ìƒ‰ ê²°ê³¼ ì¸ë±ìŠ¤. ì¸ë±ìŠ¤ëŠ” 0ë¶€í„° ì‹œìž‘í•˜ë©°, ì°¾ì§€ ëª»í•œ ê²½ìš°ì—ëŠ” -1 ì„ ë°˜í™˜í•œë‹¤.
	@since 1.2.0
	@see nv.$Element#parent
	@see nv.$Element#child
	@see nv.$Element#prev
	@see nv.$Element#next
	@see nv.$Element#first
	@see nv.$Element#last
	@example
		<div id="sample_div1">
			<div id="sample_div">
				<div id="sample_div2">
					Sample1
				</div>
				<div id="sample_div3">
					<div id="sample_div4">
						Sample2
					</div>
					Sample3
				</div>
				<div id="sample_div5">
					Sample4
					<div id="sample_div6">
						Sample5
					</div>
				</div>
			</div>
		</div>
		
		<script type="text/javascript">
			var welSample = $Element("sample_div");
			welSample.indexOf($Element("sample_div1"));	// ê²°ê³¼ : -1
			welSample.indexOf($Element("sample_div2"));	// ê²°ê³¼ : 0
			welSample.indexOf($Element("sample_div3"));	// ê²°ê³¼ : 1
			welSample.indexOf($Element("sample_div4"));	// ê²°ê³¼ : -1
			welSample.indexOf($Element("sample_div5"));	// ê²°ê³¼ : 2
			welSample.indexOf($Element("sample_div6"));	// ê²°ê³¼ : -1
		</script>
 */
nv.$Element.prototype.indexOf = function(element) {
    //-@@$Element.indexOf-@@//
    try {
        var e = nv.$Element(element)._element;
        var n = this._element.childNodes;
        var c = 0;
        var l = n.length;

        for (var i=0; i < l; i++) {
            if (n[i].nodeType != 1) continue;

            if (n[i] === e) return c;
            c++;
        }
    }catch(e){}

    return -1;
};
//-!nv.$Element.prototype.indexOf end!-//

//-!nv.$Element.prototype.queryAll start(nv.cssquery)!-//
/**
 	queryAll() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì—ì„œ íŠ¹ì • CSS ì„ íƒìž(CSS Selector)ë¥¼ ë§Œì¡±í•˜ëŠ” í•˜ìœ„ ìš”ì†Œë¥¼ ì°¾ëŠ”ë‹¤.
	
	@method queryAll
	@param {String+} sSelector CSS ì„ íƒìž. CSS ì„ íƒìžë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” íŒ¨í„´ì€ í‘œì¤€ íŒ¨í„´ê³¼ ë¹„í‘œì¤€ íŒ¨í„´ì´ ìžˆë‹¤. í‘œì¤€ íŒ¨í„´ì€ CSS Level3 ëª…ì„¸ì„œì— ìžˆëŠ” íŒ¨í„´ì„ ì§€ì›í•œë‹¤.
	@return {Array} CSS ì…€ë ‰í„° ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” HTML ìš”ì†Œ(nv.$Element() ê°ì²´)ë¥¼ ë°°ì—´ë¡œ ë°˜í™˜í•œë‹¤. ë§Œì¡±í•˜ëŠ” HTML ìš”ì†Œê°€ ì¡´ìž¬í•˜ì§€ ì•Šìœ¼ë©´ ë¹ˆ ë°°ì—´ì„ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#query
	@see nv.$Element#queryAll
	@see http://www.w3.org/TR/css3-selectors/ CSS Level3 ëª…ì„¸ì„œ - W3C
	@example
		<div id="sample">
			<div></div>
			<div class="pink"></div>
			<div></div>
			<div class="pink"></div>
			<div></div>
			<div class="blue"></div>
			<div class="blue"></div>
		</div>
		
		<script type="text/javascript">
			$Element("sample").queryAll(".pink");
			// <div class="pink"></div>ì™€ <div class="pink"></div>ë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì„ ë°˜í™˜
		
			$Element("sample").queryAll(".green");
			// [] ë¹ˆ ë°°ì—´ì„ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.queryAll = function(sSelector) { 
    //-@@$Element.queryAll-@@//
    var oArgs = g_checkVarType(arguments, {
        '4str'  : [ 'sSelector:String+']
    },"$Element#queryAll");

    var arrEle = nv.cssquery(sSelector, this._element);
    var returnArr = [];
    for(var i = 0, l = arrEle.length; i < l; i++){
        returnArr.push(nv.$Element(arrEle[i]));
    }
    return returnArr; 
};
//-!nv.$Element.prototype.queryAll end!-//

//-!nv.$Element.prototype.query start(nv.cssquery)!-//
/**
 	query() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì—ì„œ íŠ¹ì • CSS ì„ íƒìž(CSS Selector)ë¥¼ ë§Œì¡±í•˜ëŠ” ì²« ë²ˆì§¸ í•˜ìœ„ ìš”ì†Œë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method query
	@param {String+} sSelector CSS ì„ íƒìž. CSS ì„ íƒìžë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” íŒ¨í„´ì€ í‘œì¤€ íŒ¨í„´ê³¼ ë¹„í‘œì¤€ íŒ¨í„´ì´ ìžˆë‹¤. í‘œì¤€ íŒ¨í„´ì€ CSS Level3 ëª…ì„¸ì„œì— ìžˆëŠ” íŒ¨í„´ì„ ì§€ì›í•œë‹¤.
	@return {nv.$Element} CSS ì„ íƒìžì˜ ì¡°ê±´ì„ ë§Œì¡±í•˜ëŠ” ì²« ë²ˆì§¸ HTML ìš”ì†Œì˜ $Elementì¸ìŠ¤í„´ìŠ¤. ë§Œì¡±í•˜ëŠ” HTML ìš”ì†Œê°€ ì¡´ìž¬í•˜ì§€ ì•Šìœ¼ë©´ nullì„ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#test
	@see nv.$Element#queryAll
	@see http://www.w3.org/TR/css3-selectors/ CSS Level3 ëª…ì„¸ì„œ - W3C
	@example
		<div id="sample">
			<div></div>
			<div class="pink"></div>
			<div></div>
			<div class="pink"></div>
			<div></div>
			<div class="blue"></div>
			<div class="blue"></div>
		</div>
		
		<script type="text/javascript">
			$Element("sample").query(".pink");
			// ì²« ë²ˆì§¸ <div class="pink"></div> DIV ìš”ì†Œë¥¼ ë°˜í™˜
		
			$Element("sample").query(".green");
			// null ì„ ë°˜í™˜
		</script>
 */
nv.$Element.prototype.query = function(sSelector) { 
    //-@@$Element.query-@@//
    var oArgs = g_checkVarType(arguments, {
        '4str'  : [ 'sSelector:String+']
    },"$Element#query");
    var ele =  nv.cssquery.getSingle(sSelector, this._element);
    return ele === null? ele : nv.$Element(ele); 
};
//-!nv.$Element.prototype.query end!-//

//-!nv.$Element.prototype.test start(nv.cssquery)!-//
/**
 	test() ë©”ì„œë“œëŠ” HTML ìš”ì†Œì—ì„œ íŠ¹ì • CSS ì„ íƒìž(CSS Selector)ë¥¼ ë§Œì¡±í•˜ëŠ”ì§€ í™•ì¸í•œë‹¤.
	
	@method test
	@param {String+} sSelector CSS ì„ íƒìž. CSS ì„ íƒìžë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” íŒ¨í„´ì€ í‘œì¤€ íŒ¨í„´ê³¼ ë¹„í‘œì¤€ íŒ¨í„´ì´ ìžˆë‹¤. í‘œì¤€ íŒ¨í„´ì€ CSS Level3 ëª…ì„¸ì„œì— ìžˆëŠ” íŒ¨í„´ì„ ì§€ì›í•œë‹¤.
	@return {Boolean} CSS ì„ íƒìžì˜ ì¡°ê±´ì„ ë§Œì¡±í•˜ë©´ true, ê·¸ë ‡ì§€ ì•Šìœ¼ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@see nv.$Element#query
	@see nv.$Element#queryAll
	@see http://www.w3.org/TR/css3-selectors/ CSS Level3 ëª…ì„¸ì„œ - W3C
	@example
		<div id="sample" class="blue"></div>
		
		<script type="text/javascript">
			$Element("sample").test(".blue");	// ê²°ê³¼ : true
			$Element("sample").test(".red");	// ê²°ê³¼ : false
		</script>
 */
nv.$Element.prototype.test = function(sSelector) {
    //-@@$Element.test-@@// 
    var oArgs = g_checkVarType(arguments, {
        '4str'  : [ 'sSelector:String+']
    },"$Element#test");
    return nv.cssquery.test(this._element, sSelector); 
};
//-!nv.$Element.prototype.test end!-//

//-!nv.$Element.prototype.xpathAll start(nv.cssquery)!-//
/**
 	xpathAll() ë©”ì„œë“œëŠ” HTML ìš”ì†Œë¥¼ ê¸°ì¤€ìœ¼ë¡œ XPath ë¬¸ë²•ì„ ë§Œì¡±í•˜ëŠ” ìš”ì†Œë¥¼ ê°€ì ¸ì˜¨ë‹¤.
	
	@method xpathAll
	@param {String+} sXPath XPath ê°’.
	@return {Array} XPath ë¬¸ë²•ì„ ë§Œì¡±í•˜ëŠ” ìš”ì†Œ(nv.$Element() ê°ì²´)ë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´.
	@remark ì§€ì›í•˜ëŠ” ë¬¸ë²•ì´ ì œí•œì ì´ë¯€ë¡œ íŠ¹ìˆ˜í•œ ê²½ìš°ì—ë§Œ ì‚¬ìš©í•  ê²ƒì„ ê¶Œìž¥í•œë‹¤.
	@see nv.$$
	@example
		<div id="sample">
			<div>
				<div>1</div>
				<div>2</div>
				<div>3</div>
				<div>4</div>
				<div>5</div>
				<div>6</div>
			</div>
		</div>
		
		<script type="text/javascript">
			$Element("sample").xpathAll("div/div[5]");
			// <div>5</div> ìš”ì†Œë¥¼ ì›ì†Œë¡œ í•˜ëŠ” ë°°ì—´ì´ ë°˜í™˜ ë¨
		</script>
 */
nv.$Element.prototype.xpathAll = function(sXPath) {
    //-@@$Element.xpathAll-@@// 
    var oArgs = g_checkVarType(arguments, {
        '4str'  : [ 'sXPath:String+']
    },"$Element#xpathAll");
    var arrEle = nv.cssquery.xpath(sXPath, this._element);
    var returnArr = [];
    for(var i = 0, l = arrEle.length; i < l; i++){
        returnArr.push(nv.$Element(arrEle[i]));
    }
    return returnArr; 
};
//-!nv.$Element.prototype.xpathAll end!-//

//-!nv.$Element.prototype.insertAdjacentHTML.hidden start!-//
/**
 	insertAdjacentHTML í•¨ìˆ˜. ì§ì ‘ì‚¬ìš©í•˜ì§€ ëª»í•¨.
	
	@method insertAdjacentHTML
	@ignore
 */
nv.$Element.insertAdjacentHTML = function(ins,html,insertType,type,fn,sType){
    var aArg = [ html ];
    aArg.callee = arguments.callee;
    var oArgs = g_checkVarType(aArg, {
        '4str'  : [ 'sHTML:String+' ]
    },"$Element#"+sType);
    var _ele = ins._element;
    html = html+"";
    if( _ele.insertAdjacentHTML && !(/^<(option|tr|td|th|col)(?:.*?)>/.test(nv._p_.trim(html).toLowerCase()))){
        _ele.insertAdjacentHTML(insertType, html);
    }else{
        var oDoc = _ele.ownerDocument || _ele.document || document;
        var fragment = oDoc.createDocumentFragment();
        var defaultElement;
        var sTag = nv._p_.trim(html);
        var oParentTag = {
            "option" : "select",
            "tr" : "tbody",
            "thead" : "table",
            "tbody" : "table",
            "col" : "table",
            "td" : "tr",
            "th" : "tr",
            "div" : "div"
        };
        var aMatch = /^<(option|tr|thead|tbody|td|th|col)(?:.*?)\>/i.exec(sTag);
        var sChild = aMatch === null ? "div" : aMatch[1].toLowerCase();
        var sParent = oParentTag[sChild] ;
        defaultElement = nv._p_._createEle(sParent,sTag,oDoc,true);
        var scripts = defaultElement.getElementsByTagName("script");
    
        for ( var i = 0, l = scripts.length; i < l; i++ ){
            scripts[i].parentNode.removeChild( scripts[i] );
        }

        if(_ele.tagName.toLowerCase() == "table" && !_ele.getElementsByTagName("tbody").length && !sTag.match(/<tbody[^>]*>/i)) {
            var elTbody = oDoc.createElement("tbody"),
                bTheadTfoot = sTag.match(/^<t(head|foot)[^>]*>/i);

            if(!bTheadTfoot) {
                fragment.appendChild(elTbody);
                fragment = elTbody;
            }
        }

        while ( defaultElement[ type ]){
            fragment.appendChild( defaultElement[ type ] );
        }
        
        bTheadTfoot && fragment.appendChild(elTbody);
        fn(fragment.cloneNode(true));
    }
    return ins;
};

//-!nv.$Element.prototype.insertAdjacentHTML.hidden end!-//

//-!nv.$Element.prototype.appendHTML start(nv.$Element.prototype.insertAdjacentHTML)!-//
/**
 	appendHTML() ë©”ì„œë“œëŠ” ë‚´ë¶€ HTML ì½”ë“œ(innerHTML)ì˜ ë’¤ì— íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ HTML ì½”ë“œë¥¼ ë§ë¶™ì¸ë‹¤.
	
	@method appendHTML
	@param {String+} sHTML ë§ë¶™ì¼ HTML ë¬¸ìžì—´.
	@return {this} ë‚´ë¶€ HTML ì½”ë“œë¥¼ ë³€ê²½í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 1.4.8 ë²„ì „ë¶€í„° nv.$Element() ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	@since 1.4.6
	@see nv.$Element#prependHTML
	@see nv.$Element#beforeHTML
	@see nv.$Element#afterHTML
	@example
		// ë‚´ë¶€ HTML ê°€ìž¥ ë’¤ì— ë§ë¶™ì´ê¸°
		$Element("sample_ul").appendHTML("<li>3</li><li>4</li>");
		
		//Before
		<ul id="sample_ul">
			<li>1</li>
			<li>2</li>
		</ul>
		
		//After
		<ul id="sample_ul">
			<li>1</li>
			<li>2</li>
			<li>3</li>
			<li>4</li>
		</ul>
 */
nv.$Element.prototype.appendHTML = function(sHTML) {
    //-@@$Element.appendHTML-@@//
    return nv.$Element.insertAdjacentHTML(this,sHTML,"beforeEnd","firstChild",nv.$Fn(function(oEle) {
        var ele = this._element;

        if(ele.tagName.toLowerCase() === "table") {
            var nodes = ele.childNodes;

            for(var i=0,l=nodes.length; i < l; i++) {
                if(nodes[i].nodeType==1){
                    ele = nodes[i]; 
                    break;
                }
            }
        }
        ele.appendChild(oEle);
    },this).bind(),"appendHTML");
};
//-!nv.$Element.prototype.appendHTML end!-//

//-!nv.$Element.prototype.prependHTML start(nv.$Element.prototype.insertAdjacentHTML,nv.$Element._prepend)!-//
/**
 	prependHTML() ë©”ì„œë“œëŠ” ë‚´ë¶€ HTML ì½”ë“œ(innerHTML)ì˜ ì•žì— íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ HTML ì½”ë“œë¥¼ ì‚½ìž…í•œë‹¤.
	
	@method prependHTML
	@param {String+} sHTML ì‚½ìž…í•  HTML ë¬¸ìžì—´.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 1.4.8 ë²„ì „ë¶€í„° nv.$Element() ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	@since 1.4.6
	@see nv.$Element#appendHTML
	@see nv.$Element#beforeHTML
	@see nv.$Element#afterHTML
	@example
		// ë‚´ë¶€ HTML ê°€ìž¥ ì•žì— ì‚½ìž…
		$Element("sample_ul").prependHTML("<li>3</li><li>4</li>");
		
		//Before
		<ul id="sample_ul">
			<li>1</li>
			<li>2</li>
		</ul>
		
		//After
		<ul id="sample_ul">
			<li>4</li>
			<li>3</li>
			<li>1</li>
			<li>2</li>
		</ul>
 */
nv.$Element.prototype.prependHTML = function(sHTML) {
    //-@@$Element.prependHTML-@@//
    var ___element = nv.$Element;

    return ___element.insertAdjacentHTML(this,sHTML,"afterBegin","firstChild",nv.$Fn(function(oEle) {
        var ele = this._element;
        if(ele.tagName.toLowerCase() === "table") {
            var nodes = ele.childNodes;
            for(var i=0,l=nodes.length; i < l; i++) {
                if(nodes[i].nodeType==1) {
                    ele = nodes[i]; 
                    break;
                }
            }
        }
        ___element._prepend(ele,oEle);
    },this).bind(),"prependHTML");
};
//-!nv.$Element.prototype.prependHTML end!-//

//-!nv.$Element.prototype.beforeHTML start(nv.$Element.prototype.insertAdjacentHTML)!-//
/**
 	beforeHTML() ë©”ì„œë“œëŠ” HTML ì½”ë“œ(outerHTML)ì˜ ì•žì— íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ HTML ì½”ë“œë¥¼ ì‚½ìž…í•œë‹¤.
	
	@method beforeHTML
	@param {String+} sHTML ì‚½ìž…í•  HTML ë¬¸ìžì—´.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@remark 1.4.8 ë¶€í„° nv.$Element() ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	@since 1.4.6
	@see nv.$Element#appendHTML
	@see nv.$Element#prependHTML
	@see nv.$Element#afterHTML
	@example
		var welSample = $Element("sample_ul");
		
		welSample.beforeHTML("<ul><li>3</li><li>4</li></ul>");
		welSample.beforeHTML("<ul><li>5</li><li>6</li></ul>");
		
		//Before
		<ul id="sample_ul">
			<li>1</li>
			<li>2</li>
		</ul>
		
		//After
		<ul>
			<li>5</li>
			<li>6</li>
		</ul>
		<ul>
			<li>3</li>
			<li>4</li>
		</ul>
		<ul id="sample_ul">
			<li>1</li>
			<li>2</li>
		</ul>
 */
nv.$Element.prototype.beforeHTML = function(sHTML) {
    //-@@$Element.beforeHTML-@@//
    return nv.$Element.insertAdjacentHTML(this,sHTML,"beforeBegin","firstChild",nv.$Fn(function(oEle){
        this._element.parentNode.insertBefore(oEle, this._element);
    },this).bind(),"beforeHTML");
};
//-!nv.$Element.prototype.beforeHTML end!-//

//-!nv.$Element.prototype.afterHTML start(nv.$Element.prototype.insertAdjacentHTML)!-//
/**
 	afterHTML() ë©”ì„œë“œëŠ” HTML ì½”ë“œ(outerHTML)ì˜ ë’¤ì— íŒŒë¼ë¯¸í„°ë¡œ ì§€ì •í•œ HTML ì½”ë“œë¥¼ ì‚½ìž…í•œë‹¤.
	
	@method afterHTML
	@param {String+} sHTML ì‚½ìž…í•  HTML ë¬¸ìžì—´.
	@return {this} ë‚´ë¶€ HTML ì½”ë“œë¥¼ ë³€ê²½í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@since 1.4.8 ë²„ì „ë¶€í„° nv.$Element() ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	@since 1.4.6
	@see nv.$Element#appendHTML
	@see nv.$Element#prependHTML
	@see nv.$Element#beforeHTML
	@example
		var welSample = $Element("sample_ul");
		
		welSample.afterHTML("<ul><li>3</li><li>4</li></ul>");
		welSample.afterHTML("<ul><li>5</li><li>6</li></ul>");
		
		//Before
		<ul id="sample_ul">
			<li>1</li>
			<li>2</li>
		</ul>
		
		//After
		<ul id="sample_ul">
			<li>1</li>
			<li>2</li>
		</ul>
		<ul>
			<li>3</li>
			<li>4</li>
		</ul>
		<ul>
			<li>5</li>
			<li>6</li>
		</ul>
 */
nv.$Element.prototype.afterHTML = function(sHTML) {
    //-@@$Element.afterHTML-@@//
    return nv.$Element.insertAdjacentHTML(this,sHTML,"afterEnd","firstChild",nv.$Fn(function(oEle){
        this._element.parentNode.insertBefore( oEle, this._element.nextSibling );
    },this).bind(),"afterHTML");
};
//-!nv.$Element.prototype.afterHTML end!-//

//-!nv.$Element.prototype.hasEventListener start(nv.$Element.prototype.attach)!-//
/**
	ì—˜ë¦¬ë¨¼íŠ¸ì— í•´ë‹¹ ì´ë²¤íŠ¸ê°€ í• ë‹¹ë˜ì–´ ìžˆëŠ”ì§€ë¥¼ í™•ì¸.
	
	@method hasEventListener
	@param {String+} sEvent ì´ë²¤íŠ¸ëª…
	@return {Boolean} ì´ë²¤íŠ¸ í• ë‹¹ ìœ ë¬´
	@remark 2.2.0 ë²„ì „ë¶€í„°, loadì™€ domreadyì´ë²¤íŠ¸ëŠ” ê°ê° Windowì™€ Documentì—ì„œ ë°œìƒí•˜ëŠ” ì´ë²¤íŠ¸ì´ì§€ë§Œ ì„œë¡œë¥¼ êµì°¨í•´ì„œ ë“±ë¡í•˜ì—¬ë„ ì´ë²¤íŠ¸ê°€ ì˜¬ë°”ë¥´ê²Œ ë°œìƒí•œë‹¤.
	@since 2.0.0
	@example
		$Element("test").attach("click",function(){});
		
		$Element("test").hasEventListener("click"); //true
		$Element("test").hasEventListener("mousemove"); //false
 */
nv.$Element.prototype.hasEventListener = function(sEvent){

    var oArgs = g_checkVarType(arguments, {
        '4str' : [ 'sEvent:String+' ]
    },"$Element#hasEventListener"),
        oDoc,
        bHasEvent = false,
        sLowerCaseEvent = oArgs.sEvent.toLowerCase();
    
    if(this._key){
        oDoc = this._element.ownerDocument || this._element.document || document;
        
        if(sLowerCaseEvent == "load" && this._element === oDoc){
            bHasEvent = nv.$Element(window).hasEventListener(oArgs.sEvent);
        }else if(sLowerCaseEvent == "domready" && nv.$Jindo.isWindow(this._element)){
            bHasEvent = nv.$Element(oDoc).hasEventListener(oArgs.sEvent);
        }else{
            var realEvent = nv.$Element.eventManager.revisionEvent("", sEvent);
            bHasEvent = !!nv.$Element.eventManager.hasEvent(this._key, realEvent, oArgs.sEvent);
        }
        
        return bHasEvent;
    }
    
    return false;
};
//-!nv.$Element.prototype.hasEventListener end!-//

//-!nv.$Element.prototype.preventTapHighlight start(nv.$Element.prototype.addClass, nv.$Element.prototype.removeClass)!-//
/**
	ëª¨ë°”ì¼ì—ì„œ ì´ë²¤íŠ¸ ë¸ë¦¬ê²Œì´íŠ¸ë¥¼ ì‚¬ìš©í–ˆì„ë•Œ ë¶€ëª¨ ì—˜ë¦¬ë¨¼íŠ¸ì— í•˜ì´ë¼ì´íŠ¸ê°€ ë˜ëŠ” ê²ƒì„ ë§‰ëŠ”ë‹¤.
	
	@method preventTapHighlight
	@param {Boolean} bType í•˜ì´ë¼ì´íŠ¸ë¥¼ ë§‰ì„ì§€ ìœ ë¬´
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@since 2.0.0
	@example
		<ul id="test">
			<li><a href="#nhn">nhn</a></li>
			<li><a href="#naver">naver</a></li>
			<li><a href="#hangame">hangame</a></li>
		</ul>
		
		$Element("test").preventTapHighlight(true); // ì´ë ‡ê²Œ í•˜ë©´ ëª¨ë°”ì¼ì—ì„œ testì— í•˜ì´ë¼ì´íŠ¸ê°€ ë˜ëŠ” ê²ƒì„ ë§‰ëŠ”ë‹¤.
		$Element("test").delegate("click","a",function(e){});
 */
nv.$Element.prototype.preventTapHighlight = function(bFlag){
    if(nv._p_._JINDO_IS_MO){
        var sClassName = 'no_tap_highlight' + new Date().getTime();
        
        var elStyleTag = document.createElement('style');
        var elHTML = document.getElementsByTagName('html')[0];
        
        elStyleTag.type = "text/css";
        
        elHTML.insertBefore(elStyleTag, elHTML.firstChild);
        var oSheet = elStyleTag.sheet || elStyleTag.styleSheet;
        
        oSheet.insertRule('.' + sClassName + ' { -webkit-tap-highlight-color: rgba(0,0,0,0); }', 0);
        oSheet.insertRule('.' + sClassName + ' * { -webkit-tap-highlight-color: rgba(0,0,0,.25); }', 0);
        
        nv.$Element.prototype.preventTapHighlight = function(bFlag) {
            return this[bFlag ? 'addClass' : 'removeClass'](sClassName);
        };
    }else{
        nv.$Element.prototype.preventTapHighlight = function(bFlag) { return this; };
    }
    return this.preventTapHighlight.apply(this,nv._p_._toArray(arguments));
};
//-!nv.$Element.prototype.preventTapHighlight end!-//


//-!nv.$Element.prototype.data start(nv.$Json._oldToString)!-//
/**
 	data() ë©”ì„œë“œëŠ” datasetì˜ ì†ì„±ì„ ê°€ì ¸ì˜¨ë‹¤.
	
	@method data
	@param {String+} sName dataset ì´ë¦„
	@return {Variant} dataset ê°’ì„ ë°˜í™˜. setí•  ë•Œ ë„£ì€ íƒ€ìž…ìœ¼ë¡œ ë°˜í™˜í•˜ê³ , í•´ë‹¹ ì†ì„±ì´ ì—†ë‹¤ë©´ nullì„ ë°˜í™˜í•œë‹¤. ë‹¨, JSON.stringflyì˜ ë°˜í™˜ ê°’ì´ undefinedì¸ ê²½ìš°ëŠ” ì„¤ì •ë˜ì§€ ì•ŠëŠ”ë‹¤.
	@see nv.$Element#attr
 */
/**
 	data() ë©”ì„œë“œëŠ” datasetì˜ ì†ì„±ì„ ì„¤ì •í•œë‹¤.
	
	@method data
	@syntax sName, vValue
	@syntax oList
	@param {String+} sName dataset ì´ë¦„.
	@param {Variant} vValue datasetì— ì„¤ì •í•  ê°’. datasetì˜ ê°’ì„ nullë¡œ ì„¤ì •í•˜ë©´ í•´ë‹¹ datasetì„ ì‚­ì œí•œë‹¤.
	@param {Hash+} oList í•˜ë‚˜ ì´ìƒì˜ datasetê³¼ ê°’ì„ ê°€ì§€ëŠ” ê°ì²´(Object) ë˜ëŠ” í•´ì‹œ ê°ì²´(nv.$H() ê°ì²´).
	@return {this} datasetì˜ ì†ì„±ì„ ì„¤ì •í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Element#attr
	@example
		//Set
		//Before
		<ul id="maillist">
			<li id="folder">Read</li>
		</ul>
		
		//Do
		$Element("folder").data("count",123);
		$Element("folder").data("info",{
			"some1" : 1,
			"some2" : 2
		});
		
		//After
		<li id="folder" data-count="123" data-info="{\"some1\":1,\"some2\":2}">Read</li>
	@example
		//Get
		//Before
		<li id="folder" data-count="123" data-info="{\"some1\":1,\"some2\":2}">Read</li>
		
		//Do
		$Element("folder").data("count"); -> 123//Number
		$Element("folder").data("info"); -> {"some1":1, "some2":2} //Object
	@example
		//Delete
		//Before
		<li id="folder" data-count="123" data-info="{\"some1\":1,\"some2\":2}">Read</li>
		
		//Do
		$Element("folder").data("count",null);
		$Element("folder").data("info",null);
		
		//After
		<li id="folder">Read</li>
 */
nv.$Element.prototype.data = function(sKey, vValue) {
    var oType ={ 
        'g'  : ["sKey:String+"],
        's4var' : ["sKey:String+", "vValue:Variant"],
        's4obj' : ["oObj:Hash+"]
    };
    var nvKey = "_nv";
    function toCamelCase(name){
        return name.replace(/\-(.)/g,function(_,a){
            return a.toUpperCase();
        });
    }
    function toDash(name){
        return name.replace(/[A-Z]/g,function(a){
            return "-"+a.toLowerCase();
        });
    }
    if(document.body.dataset){
        nv.$Element.prototype.data = function(sKey, vValue) {
            var sToStr, oArgs = g_checkVarType(arguments, oType ,"$Element#data");
            var  isNull = nv.$Jindo.isNull;
            
            switch(oArgs+""){
                case "g":
                    sKey = toCamelCase(sKey);
                    var isMakeFromJindo = this._element.dataset[sKey+nvKey];
                    var sDateSet = this._element.dataset[sKey];
                    if(sDateSet){
                        if(isMakeFromJindo){
                            return window.JSON.parse(sDateSet);
                        }
                        return sDateSet;
                    }
                    return null;
                    // 'break' statement was intentionally omitted.
                case "s4var":
                    var oData;
                    if(isNull(vValue)){
                        sKey = toCamelCase(sKey);
                        delete this._element.dataset[sKey];
                        delete this._element.dataset[sKey+nvKey];
                        return this;
                    }else{
                        oData = {};
                        oData[sKey] = vValue;
                        sKey = oData;   
                    }
                    // 'break' statement was intentionally omitted.
                case "s4obj":
                    var sChange;
                    for(var i in sKey){
                        sChange = toCamelCase(i);
                        if(isNull(sKey[i])){
                            delete this._element.dataset[sChange];
                            delete this._element.dataset[sChange+nvKey];
                        }else{
                            sToStr = nv.$Json._oldToString(sKey[i]);
                            if(sToStr!=null){
                                this._element.dataset[sChange] = sToStr;
                                this._element.dataset[sChange+nvKey] = "nv";  
                            }
                        }
                    }
                    return this;
            }
        };
    }else{
        nv.$Element.prototype.data = function(sKey, vValue) {
            var sToStr, oArgs = g_checkVarType(arguments, oType ,"$Element#data");
            var  isNull = nv.$Jindo.isNull;
            switch(oArgs+""){
                case "g":
                    sKey = toDash(sKey);
                    var isMakeFromJindo = this._element.getAttribute("data-"+sKey+nvKey);
                    var sVal = this._element.getAttribute("data-"+sKey);
                    
                    if(isMakeFromJindo){
                        return (sVal!=null)? eval("("+sVal+")") : null;
                    }else{
                        return sVal;
                    }
                    // 'break' statement was intentionally omitted.
                case "s4var":
                    var oData;
                    if(isNull(vValue)){
                        sKey = toDash(sKey);
                        this._element.removeAttribute("data-"+sKey);
                        this._element.removeAttribute("data-"+sKey+nvKey);
                        return this;
                    }else{
                        oData = {};
                        oData[sKey] = vValue;
                        sKey = oData;   
                    }
                    // 'break' statement was intentionally omitted.
                case "s4obj":
                    var sChange;
                    for(var i in sKey){
                        sChange = toDash(i);
                        if(isNull(sKey[i])){
                            this._element.removeAttribute("data-"+sChange);
                            this._element.removeAttribute("data-"+sChange+nvKey);
                        }else{
                            sToStr = nv.$Json._oldToString(sKey[i]);
                            if(sToStr!=null){
                                this._element.setAttribute("data-"+sChange, sToStr);
                                this._element.setAttribute("data-"+sChange+nvKey, "nv");
                            }
                        }
                    }
                    return this;
            }
        };
    }
    
    return this.data.apply(this, nv._p_._toArray(arguments));
};
//-!nv.$Element.prototype.data end!-//

/**
 	@fileOverview $Jsonì˜ ìƒì„±ìž ë° ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name json.js
	@author NAVER Ajax Platform
 */

//-!nv.$Json start(nv.$Json._oldMakeJSON)!-//
/**
 	nv.$Json() ê°ì²´ëŠ” JSON(JavaScript Object Notation)ì„ ë‹¤ë£¨ê¸° ìœ„í•œ ë‹¤ì–‘í•œ ê¸°ëŠ¥ì„ ì œê³µí•œë‹¤. ìƒì„±ìžì— íŒŒë¼ë¯¸í„°ë¡œ ê°ì²´ë‚˜ ë¬¸ìžì—´ì„ ìž…ë ¥í•œë‹¤. XML í˜•íƒœì˜ ë¬¸ìžì—´ë¡œ nv.$Json() ê°ì²´ë¥¼ ìƒì„±í•˜ë ¤ë©´ fromXML() ë©”ì„œë“œë¥¼ ì‚¬ìš©í•œë‹¤.
	
	@class nv.$Json
	@keyword json, ì œì´ìŠ¨
 */
/**
 	nv.$Json() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤.
	
	@constructor
	@param {Varaint} sObject ë‹¤ì–‘í•œ íƒ€ìž…
	@return {nv.$Json} ì¸ìˆ˜ë¥¼ ì¸ì½”ë”©í•œ nv.$Json() ê°ì²´.
	@see nv.$Json#fromXML
	@see http://www.json.org/json-ko.html json.org
	@example
		var oStr = $Json ('{ zoo: "myFirstZoo", tiger: 3, zebra: 2}');
		
		var d = {name : 'nhn', location: 'Bundang-gu'}
		var oObj = $Json (d);
 */
nv.$Json = function (sObject) {
	//-@@$Json-@@//
	var cl = arguments.callee;
	if (sObject instanceof cl) return sObject;
	
	if (!(this instanceof cl)){
		try {
			nv.$Jindo._maxWarn(arguments.length, 1,"$Json");
			return new cl(arguments.length?sObject:{});
		} catch(e) {
			if (e instanceof TypeError) { return null; }
			throw e;
		}
	}	
		
	g_checkVarType(arguments, {
		'4var' : ['oObject:Variant']
	},"$Json");
	this._object = sObject;
};
//-!nv.$Json end!-//

//-!nv.$Json._oldMakeJSON.hidden start!-//
nv.$Json._oldMakeJSON = function(sObject,sType){
	try {
		if(nv.$Jindo.isString(sObject)&&/^(?:\s*)[\{\[]/.test(sObject)){
			sObject = eval("("+sObject+")");
		}else{
			return sObject;
		}
	} catch(e) {
		throw new nv.$Error(nv.$Except.PARSE_ERROR,sType);
	}
	return sObject;
};
//-!nv.$Json._oldMakeJSON.hidden end!-//

//-!nv.$Json.fromXML start!-//
/**
  	fromXML() ë©”ì„œë“œëŠ” XML í˜•íƒœì˜ ë¬¸ìžì—´ì„ nv.$Json() ê°ì²´ë¡œ ì¸ì½”ë”©í•œë‹¤. XML í˜•ì‹ì˜ ë¬¸ìžì—´ì— XML ìš”ì†Œê°€ ì†ì„±ì„ í¬í•¨í•˜ê³  ìžˆì„ ê²½ìš° í•´ë‹¹ ìš”ì†Œì˜ ì •ë³´ì— í•´ë‹¹í•˜ëŠ” ë‚´ìš©ì„ í•˜ìœ„ ê°ì²´ë¡œ í‘œí˜„í•œë‹¤. ì´ë•Œ ìš”ì†Œê°€ CDATA ê°’ì„ ê°€ì§ˆ ê²½ìš° $cdata ì†ì„±ìœ¼ë¡œ ê°’ì„ ì €ìž¥í•œë‹¤.
	
	@static
	@method fromXML
	@param {String+} sXML XML í˜•íƒœì˜ ë¬¸ìžì—´.
	@return {nv.$Json} nv.$Json() ê°ì²´.
	@throws {nv.$Except.PARSE_ERROR} jsonê°ì²´ë¥¼ íŒŒì‹±í•˜ë‹¤ê°€ ì—ëŸ¬ë°œìƒí•  ë•Œ.
	@example
		var j1 = $Json.fromXML('<data>only string</data>');
		
		// ê²°ê³¼ :
		// {"data":"only string"}
		
		var j2 = $Json.fromXML('<data><id>Faqh%$</id><str attr="123">string value</str></data>');
		
		// ê²°ê³¼ :
		// {"data":{"id":"Faqh%$","str":{"attr":"123","$cdata":"string value"}}}
  */
nv.$Json.fromXML = function(sXML) {
	//-@@$Json.fromXML-@@//
	var cache = nv.$Jindo;
	var oArgs = cache.checkVarType(arguments, {
		'4str' : ['sXML:String+']
	},"<static> $Json#fromXML");
	var o  = {};
	var re = /\s*<(\/?[\w:\-]+)((?:\s+[\w:\-]+\s*=\s*(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'))*)\s*((?:\/>)|(?:><\/\1>|\s*))|\s*<!\[CDATA\[([\w\W]*?)\]\]>\s*|\s*>?([^<]*)/ig;
	var re2= /^[0-9]+(?:\.[0-9]+)?$/;
	var ec = {"&amp;":"&","&nbsp;":" ","&quot;":"\"","&lt;":"<","&gt;":">"};
	var fg = {tags:["/"],stack:[o]};
	var es = function(s){ 
		if (cache.isUndefined(s)) return "";
		return  s.replace(/&[a-z]+;/g, function(m){ return (cache.isString(ec[m]))?ec[m]:m; });
	};
	var at = function(s,c){s.replace(/([\w\:\-]+)\s*=\s*(?:"((?:\\"|[^"])*)"|'((?:\\'|[^'])*)')/g, function($0,$1,$2,$3){c[$1] = es(($2?$2.replace(/\\"/g,'"'):undefined)||($3?$3.replace(/\\'/g,"'"):undefined));}); };
	var em = function(o){
		for(var x in o){
			if (o.hasOwnProperty(x)) {
				if(Object.prototype[x])
					continue;
					return false;
			}
		}
		return true;
	};
	/*
	  $0 : ì „ì²´
$1 : íƒœê·¸ëª…
$2 : ì†ì„±ë¬¸ìžì—´
$3 : ë‹«ëŠ”íƒœê·¸
$4 : CDATAë°”ë””ê°’
$5 : ê·¸ëƒ¥ ë°”ë””ê°’
	 */

	var cb = function($0,$1,$2,$3,$4,$5) {
		var cur, cdata = "";
		var idx = fg.stack.length - 1;
		
		if (cache.isString($1)&& $1) {
			if ($1.substr(0,1) != "/") {
				var has_attr = (typeof $2 == "string" && $2);
				var closed   = (typeof $3 == "string" && $3);
				var newobj   = (!has_attr && closed)?"":{};

				cur = fg.stack[idx];
				
				if (cache.isUndefined(cur[$1])) {
					cur[$1] = newobj; 
					cur = fg.stack[idx+1] = cur[$1];
				} else if (cur[$1] instanceof Array) {
					var len = cur[$1].length;
					cur[$1][len] = newobj;
					cur = fg.stack[idx+1] = cur[$1][len];  
				} else {
					cur[$1] = [cur[$1], newobj];
					cur = fg.stack[idx+1] = cur[$1][1];
				}
				
				if (has_attr) at($2,cur);

				fg.tags[idx+1] = $1;

				if (closed) {
					fg.tags.length--;
					fg.stack.length--;
				}
			} else {
				fg.tags.length--;
				fg.stack.length--;
			}
		} else if (cache.isString($4) && $4) {
			cdata = $4;
		} else if (cache.isString($5) && $5) {
			cdata = es($5);
		}
		
		if (cdata.replace(/^\s+/g, "").length > 0) {
			var par = fg.stack[idx-1];
			var tag = fg.tags[idx];

			if (re2.test(cdata)) {
				cdata = parseFloat(cdata);
			}else if (cdata == "true"){
				cdata = true;
			}else if(cdata == "false"){
				cdata = false;
			}
			
			if(cache.isUndefined(par)) return;
			
			if (par[tag] instanceof Array) {
				var o = par[tag];
				if (cache.isHash(o[o.length-1]) && !em(o[o.length-1])) {
					o[o.length-1].$cdata = cdata;
					o[o.length-1].toString = function(){ return cdata; };
				} else {
					o[o.length-1] = cdata;
				}
			} else {
				if (cache.isHash(par[tag])&& !em(par[tag])) {
					par[tag].$cdata = cdata;
					par[tag].toString = function(){ return cdata; };
				} else {
					par[tag] = cdata;
				}
			}
		}
	};
	
	sXML = sXML.replace(/<(\?|\!-)[^>]*>/g, "");
	sXML.replace(re, cb);
	
	return nv.$Json(o);
};
//-!nv.$Json.fromXML end!-//

//-!nv.$Json.prototype.get start!-//
/**
 	get() ë©”ì„œë“œëŠ” íŠ¹ì • ê²½ë¡œ(path)ì— í•´ë‹¹í•˜ëŠ” nv.$Json() ê°ì²´ì˜ ê°’ì„ ë°˜í™˜í•œë‹¤.

	@method get
	@param {String+} sPath ê²½ë¡œë¥¼ ì§€ì •í•œ ë¬¸ìžì—´
	@return {Array} ì§€ì •ëœ ê²½ë¡œì— í•´ë‹¹í•˜ëŠ” ê°’ì„ ì›ì†Œë¡œ ê°€ì§€ëŠ” ë°°ì—´.
	@throws {nv.$Except.PARSE_ERROR} jsonê°ì²´ë¥¼ íŒŒì‹±í•˜ë‹¤ê°€ ì—ëŸ¬ë°œìƒí•  ë•Œ.
	@example
		var j = $Json.fromXML('<data><id>Faqh%$</id><str attr="123">string value</str></data>');
		var r = j.get ("/data/id");
		
		// ê²°ê³¼ :
		// [Faqh%$]
 */
nv.$Json.prototype.get = function(sPath) {
	//-@@$Json.get-@@//
	var cache = nv.$Jindo;
	var oArgs = cache.checkVarType(arguments, {
		'4str' : ['sPath:String+']
	},"$Json#get");
	var o = nv.$Json._oldMakeJSON(this._object,"$Json#get");
	if(!(cache.isHash(o)||cache.isArray(o))){
		throw new nv.$Error(nv.$Except.JSON_MUST_HAVE_ARRAY_HASH,"$Json#get");
	}
	var p = sPath.split("/");
	var re = /^([\w:\-]+)\[([0-9]+)\]$/;
	var stack = [[o]], cur = stack[0];
	var len = p.length, c_len, idx, buf, j, e;
	
	for(var i=0; i < len; i++) {
		if (p[i] == "." || p[i] == "") continue;
		if (p[i] == "..") {
			stack.length--;
		} else {
			buf = [];
			idx = -1;
			c_len = cur.length;
			
			if (c_len == 0) return [];
			if (re.test(p[i])) idx = +RegExp.$2;
			
			for(j=0; j < c_len; j++) {
				e = cur[j][p[i]];
				if (cache.isUndefined(e)) continue;
				if (cache.isArray(e)) {
					if (idx > -1) {
						if (idx < e.length) buf[buf.length] = e[idx];
					} else {
						buf = buf.concat(e);
					}
				} else if (idx == -1) {
					buf[buf.length] = e;
				}
			}
			
			stack[stack.length] = buf;
		}
		
		cur = stack[stack.length-1];
	}

	return cur;
};
//-!nv.$Json.prototype.get end!-//

//-!nv.$Json.prototype.toString start(nv.$Json._oldToString)!-//
/**
 	toString() ë©”ì„œë“œëŠ” nv.$Json() ê°ì²´ë¥¼ JSON ë¬¸ìžì—´ í˜•íƒœë¡œ ë°˜í™˜í•œë‹¤.
	
	@method toString
	@return {String} JSON ë¬¸ìžì—´.
	@see nv.$Json#toObject
	@see nv.$Json#toXML
	@see http://www.json.org/json-ko.html json.org
	@example
		var j = $Json({foo:1, bar: 31});
		document.write (j.toString());
		document.write (j);
		
		// ê²°ê³¼ :
		// {"bar":31,"foo":1}{"bar":31,"foo":1} 
 */
nv.$Json.prototype.toString = function() {
	//-@@$Json.toString-@@//
    return nv.$Json._oldToString(this._object);

};
//-!nv.$Json.prototype.toString end!-//

//-!nv.$Json._oldToString.hidden start(nv.$H.prototype.ksort)!-//
nv.$Json._oldToString = function(oObj){
	var cache = nv.$Jindo;
	var func = {
		$ : function($) {
			if (cache.isNull($)||!cache.isString($)&&$==Infinity) return "null";
			if (cache.isFunction($)) return undefined;
			if (cache.isUndefined($)) return undefined;
			if (cache.isBoolean($)) return $?"true":"false";
			if (cache.isString($)) return this.s($);
			if (cache.isNumeric($)) return $;
			if (cache.isArray($)) return this.a($);
			if (cache.isHash($)) return this.o($);
			if (cache.isDate($)) return $+"";
			if (typeof $ == "object"||cache.isRegExp($)) return "{}";
			if (isNaN($)) return "null";
		},
		s : function(s) {
			var e = {'"':'\\"',"\\":"\\\\","\n":"\\n","\r":"\\r","\t":"\\t"};
            var c = function(m){ return (e[m] !== undefined)?e[m]:m; };
            return '"'+s.replace(/[\\"'\n\r\t]/g, c)+'"';
		},
		a : function(a) {
			var s = "[",c = "",n=a.length;
			for(var i=0; i < n; i++) {
				if (cache.isFunction(a[i])) continue;
				s += c+this.$(a[i]);
				if (!c) c = ",";
			}
			return s+"]";
		},
		o : function(o) {
			o = nv.$H(o).ksort().$value();
			var s = "{",c = "";
			for(var x in o) {
				if (o.hasOwnProperty(x)) {
					if (cache.isUndefined(o[x])||cache.isFunction(o[x])) continue;
					s += c+this.s(x)+":"+this.$(o[x]);
					if (!c) c = ",";
				}
			}
			return s+"}";
		}
	};

	return func.$(oObj);
};
//-!nv.$Json._oldToString.hidden end!-//

//-!nv.$Json.prototype.toXML start!-//
/**
 	toXML() ë©”ì„œë“œëŠ” nv.$Json() ê°ì²´ë¥¼ XML í˜•íƒœì˜ ë¬¸ìžì—´ë¡œ ë°˜í™˜í•œë‹¤.
	
	@method toXML
	@return {String} XML í˜•íƒœì˜ ë¬¸ìžì—´.
	@throws {nv.$Except.PARSE_ERROR} jsonê°ì²´ë¥¼ íŒŒì‹±í•˜ë‹¤ê°€ ì—ëŸ¬ë°œìƒí•  ë•Œ.
	@see nv.$Json#toObject
	@see nv.$Json#toString
	@example
		var json = $Json({foo:1, bar: 31});
		json.toXML();
		
		// ê²°ê³¼ :
		// <foo>1</foo><bar>31</bar>
 */
nv.$Json.prototype.toXML = function() {
	//-@@$Json.toXML-@@//
	var f = function($,tag) {
		var t = function(s,at) { return "<"+tag+(at||"")+">"+s+"</"+tag+">"; };
		
		switch (typeof $) {
			case 'undefined':
			case "null":
				return t("");
			case "number":
				return t($);
			case "string":
				if ($.indexOf("<") < 0){
					 return t($.replace(/&/g,"&amp;"));
				}else{
					return t("<![CDATA["+$+"]]>");
				}
				// 'break' statement was intentionally omitted.
			case "boolean":
				return t(String($));
			case "object":
				var ret = "";
				if ($ instanceof Array) {
					var len = $.length;
					for(var i=0; i < len; i++) { ret += f($[i],tag); }
				} else {
					var at = "";

					for(var x in $) {
						if ($.hasOwnProperty(x)) {
							if (x == "$cdata" || typeof $[x] == "function") continue;
							ret += f($[x], x);
						}
					}

					if (tag) ret = t(ret, at);
				}
				return ret;
		}
	};
	
	return f(nv.$Json._oldMakeJSON(this._object,"$Json#toXML"), "");
};
//-!nv.$Json.prototype.toXML end!-//

//-!nv.$Json.prototype.toObject start!-//
/**
 	toObject() ë©”ì„œë“œëŠ” nv.$Json() ê°ì²´ë¥¼ ì›ëž˜ì˜ ë°ì´í„° ê°ì²´ë¡œ ë°˜í™˜í•œë‹¤.
	
	@method toObject
	@return {Object} ì›ë³¸ ë°ì´í„° ê°ì²´.
	@throws {nv.$Except.PARSE_ERROR} jsonê°ì²´ë¥¼ íŒŒì‹±í•˜ë‹¤ê°€ ì—ëŸ¬ë°œìƒí•  ë•Œ.
	@see nv.$Json#toObject
	@see nv.$Json#toString
	@see nv.$Json#toXML
	@example
		var json = $Json({foo:1, bar: 31});
		json.toObject();
		
		// ê²°ê³¼ :
		// {foo: 1, bar: 31}
 */
nv.$Json.prototype.toObject = function() {
	//-@@$Json.toObject-@@//
	//-@@$Json.$value-@@//
	return nv.$Json._oldMakeJSON(this._object,"$Json#toObject");
};
//-!nv.$Json.prototype.toObject end!-//

//-!nv.$Json.prototype.compare start(nv.$Json._oldToString,nv.$Json.prototype.toObject,nv.$Json.prototype.toString)!-//
/**
 	compare() ë©”ì„œë“œëŠ” Json ê°ì²´ë¼ë¦¬ ê°’ì´ ê°™ì€ì§€ ë¹„êµí•œë‹¤.
	
	@method compare
	@param {Varaint} oData ë¹„êµí•  Json í¬ë§· ê°ì²´.
	@return {Boolean} ë¹„êµ ê²°ê³¼. ê°’ì´ ê°™ìœ¼ë©´ true, ë‹¤ë¥´ë©´ falseë¥¼ ë°˜í™˜í•œë‹¤.
	@throws {nv.$Except.PARSE_ERROR} jsonê°ì²´ë¥¼ íŒŒì‹±í•˜ë‹¤ê°€ ì—ëŸ¬ë°œìƒí•  ë•Œ.
	@since  1.4.4
	@example
		$Json({foo:1, bar: 31}).compare({foo:1, bar: 31});
		
		// ê²°ê³¼ :
		// true
		
		$Json({foo:1, bar: 31}).compare({foo:1, bar: 1});
		
		// ê²°ê³¼ :
		// false
 */
nv.$Json.prototype.compare = function(oObj){
	//-@@$Json.compare-@@//
	var cache = nv.$Jindo;
	var oArgs = cache.checkVarType(arguments, {
		'4obj' : ['oData:Hash+'],
		'4arr' : ['oData:Array+']
	},"$Json#compare");
	function compare(vSrc, vTar) {
		if (cache.isArray(vSrc)) {
			if (vSrc.length !== vTar.length) { return false; }
			for (var i = 0, nLen = vSrc.length; i < nLen; i++) {
				if (!arguments.callee(vSrc[i], vTar[i])) { return false; }
			}
			return true;
		} else if (cache.isRegExp(vSrc) || cache.isFunction(vSrc) || cache.isDate(vSrc)) {  // which compare using toString
			return String(vSrc) === String(vTar);
		} else if (typeof vSrc === "number" && isNaN(vSrc)) {
			return isNaN(vTar);
		} else if (cache.isHash(vSrc)) {
			var nLen = 0;
			for (var k in vSrc) {nLen++; }
			for (var k in vTar) { nLen--; }
			if (nLen !== 0) { return false; }

			for (var k in vSrc) {
				if (k in vTar === false || !arguments.callee(vSrc[k], vTar[k])) { return false; }
			}

			return true;
		}
		
		// which comare using ===
		return vSrc === vTar;
		
	}
	try{
		return compare(nv.$Json._oldMakeJSON(this._object,"$Json#compare"), oObj);
	}catch(e){
		return false;
	}
};
//-!nv.$Json.prototype.compare end!-//

//-!nv.$Json.prototype.$value start(nv.$Json.prototype.toObject)!-//
/**
 	$value() ë©”ì„œë“œëŠ” toObject() ë©”ì„œë“œì™€ ê°™ì´ ì›ëž˜ì˜ ë°ì´í„° ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method $value
	@return {Object} ì›ë³¸ ë°ì´í„° ê°ì²´.
	@see nv.$Json#toObject
 */
nv.$Json.prototype.$value = nv.$Json.prototype.toObject;
//-!nv.$Json.prototype.$value end!-//

/**
	@fileOverview nv.$Ajax() ê°ì²´ì˜ ìƒì„±ìž ë° ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name Ajax.js
	@author NAVER Ajax Platform
 */

//-!nv.$Ajax start(nv.$Json.prototype.toString,nv.$Fn.prototype.bind)!-//
/**
	nv.$Ajax() ê°ì²´ëŠ” ë‹¤ì–‘í•œ ê°œë°œ í™˜ê²½ì—ì„œ Ajax ìš”ì²­ê³¼ ì‘ë‹µì„ ì‰½ê²Œ êµ¬í˜„í•˜ê¸° ìœ„í•œ ë©”ì„œë“œë¥¼ ì œê³µí•œë‹¤.
	
	@class nv.$Ajax
	@keyword ajax
 */
/**
	nv.$Ajax() ê°ì²´ëŠ” ì„œë²„ì™€ ë¸Œë¼ìš°ì € ì‚¬ì´ì˜ ë¹„ë™ê¸° í†µì‹ , ì¦‰ Ajax í†µì‹ ì„ ì§€ì›í•œë‹¤. nv.$Ajax() ê°ì²´ëŠ” XHR ê°ì²´(XMLHTTPRequest)ë¥¼ ì‚¬ìš©í•œ ê¸°ë³¸ì ì¸ ë°©ì‹ê³¼ í•¨ê»˜ ë‹¤ë¥¸ ë„ë©”ì¸ ì‚¬ì´ì˜ í†µì‹ ì„ ìœ„í•œ ì—¬ëŸ¬ ë°©ì‹ì„ ì œê³µí•œë‹¤.
	
	@constructor
	@param {String+} sUrl Ajax ìš”ì²­ì„ ë³´ë‚¼ ì„œë²„ì˜ URL.
	@param {Hash+} oOption $Ajax()ì—ì„œ ì‚¬ìš©í•˜ëŠ” ì½œë°± í•¨ìˆ˜, í†µì‹  ë°©ì‹ ë“±ê³¼ ê°™ì€ ë‹¤ì–‘í•œ ì •ë³´ë¥¼ ì •ì˜í•œë‹¤.
		@param {String} [oOption.type="xhr"] Ajax ìš”ì²­ ë°©ì‹.
			@param {String} [oOption.type."xhr"] ë¸Œë¼ìš°ì €ì— ë‚´ìž¥ëœ XMLHttpRequest ê°ì²´ë¥¼ ì´ìš©í•˜ì—¬ Ajax ìš”ì²­ì„ ì²˜ë¦¬í•œë‹¤. 
					<ul>
						<li>text, xml, json í˜•ì‹ì˜ ì‘ë‹µ ë°ì´í„°ë¥¼ ì²˜ë¦¬í•  ìˆ˜ ìžˆë‹¤. </li>
						<li>ìš”ì²­ ì‹¤íŒ¨ ì‹œ HTTP ì‘ë‹µ ì½”ë“œë¥¼ í†µí•´ ì›ì¸ íŒŒì•…ì´ ê°€ëŠ¥í•˜ë‹¤.</li>
						<li>2.1.0 ë²„ì „ ì´ìƒì—ì„œëŠ” í¬ë¡œìŠ¤ ë„ë©”ì¸ì´ ì•„ë‹Œ xhrì˜ ê²½ìš° í—¤ë”ì— "X-Requested-With" : "XMLHttpRequest"ì„ í¬í•¨í•¨. </li>
						<li>ë‹¨, í¬ë¡œìŠ¤ ë„ë©”ì¸(Cross-Domain) ìƒí™©ì—ì„œ ì‚¬ìš©í•  ìˆ˜ ì—†ë‹¤.</li>
						<li>2.1.0 ë²„ì „ ì´ìƒì€ ëª¨ë°”ì¼ì—ì„œ ê°€ëŠ¥. ë°˜ë“œì‹œ ì„œë²„ì„¤ì •ì´ í•„ìš”. (ìžì„¸í•œ ì‚¬ìš©ë²•ì€ <auidoc:see content="http://devcafe.nhncorp.com/ajaxui/board_5/574863">devcafe</auidoc:see>ë¥¼ ì°¸ê³ )</li>
					</ul>
			@param {String} oOption.type."iframe" iframe ìš”ì†Œë¥¼ í”„ë¡ì‹œë¡œ ì‚¬ìš©í•˜ì—¬ Ajax ìš”ì²­ì„ ì²˜ë¦¬í•œë‹¤.
					<ul>
						<li>í¬ë¡œìŠ¤ ë„ë©”ì¸ ìƒí™©ì—ì„œ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.</li>
						<li>iframe ìš”ì²­ ë°©ì‹ì€ ë‹¤ìŒê³¼ ê°™ì´ ë™ìž‘í•œë‹¤.
							<ol class="decimal">
								<li>ë¡œì»¬(ìš”ì²­ í•˜ëŠ” ìª½)ê³¼ ì›ê²©(ìš”ì²­ ë°›ëŠ” ìª½)ì— ëª¨ë‘ í”„ë¡ì‹œìš© HTML íŒŒì¼ì„ ë§Œë“ ë‹¤.</li>
								<li>ë¡œì»¬ í”„ë¡ì‹œì—ì„œ ì›ê²© í”„ë¡ì‹œë¡œ ë°ì´í„°ë¥¼ ìš”ì²­í•œë‹¤.</li>
								<li>ì›ê²© í”„ë¡ì‹œê°€ ì›ê²© ë„ë©”ì¸ì— XHR ë°©ì‹ìœ¼ë¡œ ë‹¤ì‹œ Ajax ìš”ì²­í•œë‹¤.</li>
								<li>ì‘ë‹µì„ ë°›ì€ ì›ê²© í”„ë¡ì‹œì—ì„œ ë¡œì»¬ í”„ë¡ì‹œë¡œ ë°ì´í„°ë¥¼ ì „ë‹¬í•œë‹¤.</li>
								<li>ë¡œì»¬ í”„ë¡ì‹œì—ì„œ ìµœì¢…ì ìœ¼ë¡œ ì½œë°± í•¨ìˆ˜(onload)ë¥¼ í˜¸ì¶œí•˜ì—¬ ì²˜ë¦¬í•œë‹¤.</li>
							</ol>
						</li>
						<li>ë¡œì»¬ í”„ë¡ì‹œ íŒŒì¼ê³¼ ì›ê²© í”„ë¡ì‹œ íŒŒì¼ì€ ë‹¤ìŒê³¼ ê°™ì´ ìž‘ì„±í•  ìˆ˜ ìžˆë‹¤.
							<ul>
								<li>ì›ê²© í”„ë¡ì‹œ íŒŒì¼ : ajax_remote_callback.html</li>
								<li>ë¡œì»¬ í”„ë¡ì‹œ íŒŒì¼ : ajax_local_callback.html</li>
							</ul>
						</li>
						<li>iframe ìš”ì†Œë¥¼ ì‚¬ìš©í•œ ë°©ì‹ì€ ì¸í„°ë„· ìµìŠ¤í”Œë¡œëŸ¬ì—ì„œ "ë”±ë”±"í•˜ëŠ” íŽ˜ì´ì§€ ì´ë™ìŒì´ ë°œìƒí•  ìˆ˜ ìžˆë‹¤. (ìš”ì²­ë‹¹ 2íšŒ)</li>
					</ul>
			@param {String} oOption.type."jsonp" JSON í˜•ì‹ê³¼ &lt;script&gt; íƒœê·¸ë¥¼ ì‚¬ìš©í•˜ì—¬ ì‚¬ìš©í•˜ì—¬ Ajax ìš”ì²­ì„ ì²˜ë¦¬í•œë‹¤.
					<ul>
						<li>í¬ë¡œìŠ¤ ë„ë©”ì¸ ìƒí™©ì—ì„œ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.</li>
						<li>jsonp ìš”ì²­ ë°©ì‹ì€ ë‹¤ìŒê³¼ ê°™ì´ ë™ìž‘í•œë‹¤.
							<ol class="decimal">
								<li>&lt;script&gt; íƒœê·¸ë¥¼ ë™ì ìœ¼ë¡œ ìƒì„±í•œë‹¤. ì´ë•Œ ìš”ì²­í•  ì›ê²© íŽ˜ì´ì§€ë¥¼ src ì†ì„±ìœ¼ë¡œ ìž…ë ¥í•˜ì—¬ GET ë°©ì‹ìœ¼ë¡œ ìš”ì²­ì„ ì „ì†¡í•œë‹¤.</li>
								<li>ìš”ì²­ ì‹œì— ì½œë°± í•¨ìˆ˜ë¥¼ ë§¤ê°œ ë³€ìˆ˜ë¡œ ë„˜ê¸°ë©´, ì›ê²© íŽ˜ì´ì§€ì—ì„œ ì „ë‹¬ë°›ì€ ì½œë°± í•¨ìˆ˜ëª…ìœ¼ë¡œ ì•„ëž˜ì™€ ê°™ì´ ì‘ë‹µì„ ë³´ë‚¸ë‹¤.
									<ul>
										<li>function_name(...ê²°ê³¼ ê°’...)</li>
									</ul>
								</li>
								<li>ì‘ë‹µì€ ì½œë°± í•¨ìˆ˜(onload)ì—ì„œ ì²˜ë¦¬ëœë‹¤.</li>
							</ol>
						</li>
						<li>GET ë°©ì‹ë§Œ ê°€ëŠ¥í•˜ë¯€ë¡œ, ì „ì†¡ ë°ì´í„°ì˜ ê¸¸ì´ëŠ” URLì—ì„œ í—ˆìš©í•˜ëŠ” ê¸¸ì´ë¡œ ì œí•œëœë‹¤.</li>
					</ul>
			@param {String} oOption.type."flash" í”Œëž˜ì‹œ ê°ì²´ë¥¼ ì‚¬ìš©í•˜ì—¬ Ajax ìš”ì²­ì„ ì²˜ë¦¬í•œë‹¤.
					<ul>
						<li>í¬ë¡œìŠ¤ ë„ë©”ì¸ ìƒí™©ì—ì„œ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.</li>
						<li>ì´ ë°©ì‹ì„ ì‚¬ìš©í•  ë•Œ ì›ê²© ì„œë²„ì˜ ì›¹ ë£¨íŠ¸ ë””ë ‰í„°ë¦¬ì— crossdomain.xml íŒŒì¼ì´ ì¡´ìž¬í•´ì•¼ í•˜ë©° í•´ë‹¹ íŒŒì¼ì— ì ‘ê·¼ ê¶Œí•œì´ ì„¤ì •ë˜ì–´ ìžˆì–´ì•¼ í•œë‹¤.</li>
						<li>ëª¨ë“  í†µì‹ ì€ í”Œëž˜ì‹œ ê°ì²´ë¥¼ í†µí•˜ì—¬ ì£¼ê³  ë°›ìœ¼ë©° Ajax ìš”ì²­ì„ ì‹œë„í•˜ê¸° ì „ì— ë°˜ë“œì‹œ í”Œëž˜ì‹œ ê°ì²´ë¥¼ ì´ˆê¸°í™”í•´ì•¼ í•œë‹¤.</li>
						<li>$Ajax.SWFRequest.write() ë©”ì„œë“œë¥¼ ì‚¬ìš©í•˜ì—¬ í”Œëž˜ì‹œ ê°ì²´ë¥¼ ì´ˆê¸°í™”í•˜ë©° í•´ë‹¹ ë©”ì„œë“œëŠ” &lt;body&gt; ìš”ì†Œ ì•ˆì— ìž‘ì„±í•œë‹¤.</li>
						<li>ë§Œì•½ httpsì—ì„œ https ìª½ìœ¼ë¡œ í˜¸ì¶œí•  ê²½ìš° &lt;allow-access-from domain="*" secure="true" /&gt; ì²˜ëŸ¼ secureì„ trueë¡œ ì„¤ì •í•´ì•¼ í•˜ë©° ê·¸ ì´ì™¸ì—ëŠ” falseë¡œ ì„¤ì •í•œë‹¤.</li>
					</ul>
		@param {String} [oOption.method="post"] HTTP ìš”ì²­ ë°©ì‹ìœ¼ë¡œ post, get, put, delete ë°©ì‹ì„ ì§€ì›í•œë‹¤.
			@param {String} [oOption.method."post"] post ë°©ì‹ìœ¼ë¡œ http ìš”ì²­ì„ ì „ë‹¬í•œë‹¤.
			@param {String} oOption.method."get" get ë°©ì‹ìœ¼ë¡œ http ìš”ì²­ì„ ì „ë‹¬í•œë‹¤. type ì†ì„±ì´ "jsonp" ë°©ì‹ìœ¼ë¡œ ì§€ì •ë˜ë©´ HTTP ìš”ì²­ ë°©ì‹ì€ "get"ìœ¼ë¡œ ì„¤ì •ëœë‹¤.
			@param {String} oOption.method."put" put ë°©ì‹ìœ¼ë¡œ http ìš”ì²­ì„ ì „ë‹¬í•œë‹¤. (1.4.2 ë²„ì „ë¶€í„° ì§€ì›).
			@param {String} oOption.method."delete" delete ë°©ì‹ìœ¼ë¡œ http ìš”ì²­ì„ ì „ë‹¬í•œë‹¤. (1.4.2 ë²„ì „ë¶€í„° ì§€ì›).
		@param {Number} [oOption.timeout=0] ìš”ì²­ íƒ€ìž„ ì•„ì›ƒ ì‹œê°„.  (ë‹¨ìœ„ ì´ˆ)
				<ul>
					<li>ë¹„ë™ê¸° í˜¸ì¶œì¸ ê²½ìš°ì—ë§Œ ì‚¬ìš© ê°€ëŠ¥í•˜ë‹¤.</li>
					<li>íƒ€ìž„ ì•„ì›ƒ ì‹œê°„ ì•ˆì— ìš”ì²­ì´ ì™„ë£Œë˜ì§€ ì•Šìœ¼ë©´ Ajax ìš”ì²­ì„ ì¤‘ì§€í•œë‹¤.</li>
					<li>ìƒëžµí•˜ê±°ë‚˜ ê¸°ë³¸ê°’(0)ì„ ì§€ì •í•œ ê²½ìš° íƒ€ìž„ ì•„ì›ƒì„ ì ìš©í•˜ì§€ ì•ŠëŠ”ë‹¤. </li>
				</ul>
		@param {Boolean} [oOption.withCredentials=false] xhrì—ì„œ í¬ë¡œìŠ¤ ë„ë©”ì¸ ì‚¬ìš©í•  ë•Œ ì¿ í‚¤ ì‚¬ìš©ì—¬ë¶€. (ë‹¨ìœ„ ì´ˆ)
				<ul>
					<li>ëª¨ë°”ì¼ë§Œ ê°€ëŠ¥í•˜ë‹¤.</li>
					<li>trueë¡œ ì„¤ì •í•˜ë©´ ì„œë²„ì—ì„œë„  "Access-Control-Allow-Credentials: true" í—¤ë”ë¥¼ ì„¤ì •í•´ì•¼ í•œë‹¤.</li>
				</ul>
		@param {Function} oOption.onload ìš”ì²­ì´ ì™„ë£Œë˜ë©´ ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜. ì½œë°± í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¡œ ì‘ë‹µ ê°ì²´ì¸ <auidoc:see content="nv.$Ajax.Response"/> ê°ì²´ê°€ ì „ë‹¬ëœë‹¤.
		@param {Function} [oOption.onerror="onload ì†ì„±ì— ì§€ì •í•œ ì½œë°± í•¨ìˆ˜"] ìš”ì²­ì´ ì‹¤íŒ¨í•˜ë©´ ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜. ìƒëžµí•˜ë©´ ì˜¤ë¥˜ê°€ ë°œìƒí•´ë„ onload ì†ì„±ì— ì§€ì •í•œ ì½œë°± í•¨ìˆ˜ë¥¼ ì‹¤í–‰í•œë‹¤.
		@param {Function} [oOption.ontimeout=function(){}] íƒ€ìž„ ì•„ì›ƒì´ ë˜ì—ˆì„ ë•Œ ì‹¤í–‰í•  ì½œë°± í•¨ìˆ˜. ìƒëžµí•˜ë©´ íƒ€ìž„ ì•„ì›ƒ ë°œìƒí•´ë„ ì•„ë¬´ëŸ° ì²˜ë¦¬ë¥¼ í•˜ì§€ ì•ŠëŠ”ë‹¤.
		@param {String} oOption.proxy ë¡œì»¬ í”„ë¡ì‹œ íŒŒì¼ì˜ ê²½ë¡œ. type ì†ì„±ì´ "iframe"ì¼ ë•Œ ì‚¬ìš©.
		@param {String} [oOption.jsonp_charset="utf-8"] ìš”ì²­ ì‹œ ì‚¬ìš©í•  &lt;script&gt; ì¸ì½”ë”© ë°©ì‹. type ì†ì„±ì´ "jsonp"ì¼ ë•Œ ì‚¬ìš©í•œë‹¤. (0.4.2 ë²„ì „ë¶€í„° ì§€ì›).
		@param {String} [oOption.callbackid="ëžœë¤í•œ ID"] ì½œë°± í•¨ìˆ˜ ì´ë¦„ì— ì‚¬ìš©í•  ID.
				<ul>
					<li>type ì†ì„±ì´ "jsonp"ì¼ ë•Œ ì‚¬ìš©í•œë‹¤. (1.3.0 ë²„ì „ë¶€í„° ì§€ì›)</li>
					<li>jsonp ë°©ì‹ì—ì„œ Ajax ìš”ì²­í•  ë•Œ ì½œë°± í•¨ìˆ˜ ì´ë¦„ì— ëžœë¤í•œ ID ê°’ì„ ë§ë¶™ì—¬ ë§Œë“  ì½œë°± í•¨ìˆ˜ ì´ë¦„ì„ ì„œë²„ë¡œ ì „ë‹¬í•œë‹¤. ì´ë•Œ ëžœë¤í•œ ê°’ì„ IDë¡œ ì‚¬ìš©í•˜ì—¬ ë„˜ê¸°ë¯€ë¡œ ìš”ì²­ URLì´ ë§¤ë²ˆ ìƒˆë¡­ê²Œ ìƒì„±ë˜ì–´ ìºì‹œ ì„œë²„ê°€ ì•„ë‹Œ ï¿½ï¿½ï¿½ë²„ë¡œ ì§ì ‘ ë°ì´í„°ë¥¼ ìš”ì²­í•˜ê²Œ ëœë‹¤. ë”°ë¼ì„œ ID ê°’ì„ ì§€ì •í•˜ë©´ ëžœë¤í•œ ì•„ì´ë”” ê°’ìœ¼ë¡œ ì½œë°± í•¨ìˆ˜ ì´ë¦„ì„ ìƒì„±í•˜ì§€ ì•Šìœ¼ë¯€ë¡œ ìºì‹œ ì„œë²„ë¥¼ ì‚¬ìš©í•˜ì—¬ ê·¸ì— ëŒ€í•œ ížˆíŠ¸ìœ¨ì„ ë†’ì´ê³ ìž í•  ë•Œ IDë¥¼ ì§€ì •í•˜ì—¬ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.</li>
				</ul>
		@param {String} [oOption.callbackname="_callback"] ì½œë°± í•¨ìˆ˜ ì´ë¦„. type ì†ì„±ì´ "jsonp"ì¼ ë•Œ ì‚¬ìš©í•˜ë©°, ì„œë²„ì— ìš”ì²­í•  ì½œë°± í•¨ìˆ˜ì˜ ì´ë¦„ì„ ì§€ì •í•  ìˆ˜ ìžˆë‹¤. (1.3.8 ë²„ì „ë¶€í„° ì§€ì›).
		@param {Boolean} [oOption.sendheader=true] ìš”ì²­ í—¤ë”ë¥¼ ì „ì†¡í• ì§€ ì—¬ë¶€.<br>type ì†ì„±ì´ "flash"ì¼ ë•Œ ì‚¬ìš©í•˜ë©°, ì„œë²„ì—ì„œ ì ‘ê·¼ ê¶Œí•œì„ ì„¤ì •í•˜ëŠ” crossdomain.xmlì— allow-headerê°€ ì„¤ì •ë˜ì–´ ìžˆì§€ ì•Šë‹¤ë©´ ë°˜ë“œì‹œ false ë¡œ ì„¤ì •í•´ì•¼ í•œë‹¤. (1.3.4 ë²„ì „ë¶€í„° ì§€ì›).<br>
				<ul>
					<li>í”Œëž˜ì‹œ 9ì—ì„œëŠ” allow-headerê°€ falseì¸ ê²½ìš° get ë°©ì‹ìœ¼ë¡œë§Œ ajax í†µì‹ ì´ ê°€ëŠ¥í•˜ë‹¤.</li>
					<li>í”Œëž˜ì‹œ 10ì—ì„œëŠ” allow-headerê°€ falseì¸ ê²½ìš° get,post ë‘˜ë‹¤ ajax í†µì‹ ì´ ì•ˆëœë‹¤.</li>
					<li>allow-headerê°€ ì„¤ì •ë˜ì–´ ìžˆì§€ ì•Šë‹¤ë©´ ë°˜ë“œì‹œ falseë¡œ ì„¤ì •í•´ì•¼ í•œë‹¤.</li>
				</ul>
		@param {Boolean} [oOption.async=true] ë¹„ë™ê¸° í˜¸ì¶œ ì—¬ë¶€. type ì†ì„±ì´ "xhr"ì¼ ë•Œ ì´ ì†ì„± ê°’ì´ ìœ íš¨í•˜ë‹¤. (1.3.7 ë²„ì „ë¶€í„° ì§€ì›).
		@param {Boolean} [oOption.decode=true] type ì†ì„±ì´ "flash"ì¼ ë•Œ ì‚¬ìš©í•˜ë©°, ìš”ì²­í•œ ë°ì´í„° ì•ˆì— utf-8 ì´ ì•„ë‹Œ ë‹¤ë¥¸ ì¸ì½”ë”©ì´ ë˜ì–´ ìžˆì„ë•Œ false ë¡œ ì§€ì •í•œë‹¤. (1.4.0 ë²„ì „ë¶€í„° ì§€ì›). 
		@param {Boolean} [oOption.postBody=false] Ajax ìš”ì²­ ì‹œ ì„œë²„ë¡œ ì „ë‹¬í•  ë°ì´í„°ë¥¼ Body ìš”ì†Œì— ì „ë‹¬í•  ì§€ì˜ ì—¬ë¶€.<br>
				type ì†ì„±ì´ "xhr"ì´ê³  methodê°€ "get"ì´ ì•„ë‹ˆì–´ì•¼ ìœ íš¨í•˜ë©° REST í™˜ê²½ì—ì„œ ì‚¬ìš©ëœë‹¤. (1.4.2 ë²„ì „ë¶€í„° ì§€ì›).
	@throws {nv.$Except.REQUIRE_AJAX} ì‚¬ìš©í•˜ëŠ” íƒ€ìž…ì˜ ajaxê°€ ì—†ëŠ” ê²½ìš°. 
	@throws {nv.$Except.CANNOT_USE_OPTION} ì‚¬ìš©í•˜ì§€ ëª»í•˜ëŠ” ì˜µì…˜ì„ ì‚¬ìš©í•  ê²½ìš°.
	@remark nv.$Ajax() ê°ì²´ì˜ ê¸°ë³¸ì ì¸ ì´ˆê¸°í™” ë°©ì‹ì€ ë‹¤ìŒê³¼ ê°™ë‹¤.
<pre class="code "><code class="prettyprint linenums">
	// í˜¸ì¶œí•˜ëŠ” URLì´ í˜„ìž¬ íŽ˜ì´ì§€ì˜ URLê³¼ ë‹¤ë¥¸ ê²½ìš°, CORS ë°©ì‹ìœ¼ë¡œ í˜¸ì¶œí•œë‹¤. XHR2 ê°ì²´ ë˜ëŠ” IE8,9ëŠ” XDomainRequestë¥¼ ì‚¬ìš©í•œë‹¤.
	var oAjax = new $Ajax('server.php', {
	    type : 'xhr',
	    method : 'get',     // GET ë°©ì‹ìœ¼ë¡œ í†µì‹ 
	    onload : function(res){ // ìš”ì²­ì´ ì™„ë£Œë˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜
	      $('list').innerHTML = res.text();
	    },
	    timeout : 3,      // 3ì´ˆ ì´ë‚´ì— ìš”ì²­ì´ ì™„ë£Œë˜ì§€ ì•Šìœ¼ë©´ ontimeout ì‹¤í–‰ (ìƒëžµ ì‹œ 0)
	    ontimeout : function(){ // íƒ€ìž„ ì•„ì›ƒì´ ë°œìƒí•˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜, ìƒëžµ ì‹œ íƒ€ìž„ ì•„ì›ƒì´ ë˜ë©´ ì•„ë¬´ ì²˜ë¦¬ë„ í•˜ì§€ ì•ŠìŒ
	      alert("Timeout!");
	    },
	    async : true      // ë¹„ë™ê¸°ë¡œ í˜¸ì¶œí•˜ëŠ” ê²½ìš°, ìƒëžµí•˜ë©´ true
	});
	oAjax.request();
</code></pre><br>
	oOption ê°ì²´ì˜ í”„ë¡œí¼í‹°ì™€ ì‚¬ìš©ë²•ì— ëŒ€í•œ ì„¤ëª…ì€ ë‹¤ìŒ í‘œì™€ ê°™ë‹¤.<br>
		<h5>íƒ€ìž…ì— ë”°ë¥¸ ì˜µì…˜ì˜ ì‚¬ìš© ê°€ëŠ¥ ì—¬ë¶€</h5>
		<table class="tbl_board">
			<caption class="hide">íƒ€ìž…ì— ë”°ë¥¸ ì˜µì…˜ì˜ ì‚¬ìš© ê°€ëŠ¥ ì—¬ë¶€</caption>
			<thead>
				<th scope="col">ì˜µì…˜</th>
				<th scope="col">xhr</th>
				<th scope="col">jsonp</th>
				<th scope="col">flash</th>
				<th scope="col">iframe</th>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">method(get, post, put, delete)</td>
					<td>O</td>
					<td>get</td>
					<td>get, post</td>
					<td>iframe</td>
				</tr>
				<tr>
					<td class="txt bold">onload</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
				</tr>
				<tr>
					<td class="txt bold">timeout</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">ontimeout</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">onerror</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">async</td>
					<td>O</td>
					<td>X</td>
					<td>X</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">postBody</td>
					<td>methodê°€ post, put, deleteë§Œ ê°€ëŠ¥</td>
					<td>X</td>
					<td>X</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">jsonp_charset</td>
					<td>X</td>
					<td>O</td>
					<td>X</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">callbackid</td>
					<td>X</td>
					<td>O</td>
					<td>X</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">callbackname</td>
					<td>X</td>
					<td>O</td>
					<td>X</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">setheader</td>
					<td>O</td>
					<td>X</td>
					<td>O</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">decode</td>
					<td>X</td>
					<td>X</td>
					<td>O</td>
					<td>X</td>
				</tr>
				<tr>
					<td class="txt bold">proxy</td>
					<td>X</td>
					<td>X</td>
					<td>X</td>
					<td>O</td>
				</tr>
			</tbody>
		</table>
		<h5>íƒ€ìž…ì— ë”°ë¥¸ ë©”ì„œë“œì˜ ì‚¬ìš© ê°€ëŠ¥ ì—¬ë¶€</h5>
		<table class="tbl_board">
			<caption class="hide">íƒ€ìž…ì— ë”°ë¥¸ ë©”ì„œë“œì˜ ì‚¬ìš© ê°€ëŠ¥ ì—¬ë¶€</caption>
			<thead>
				<th scope="col">ë©”ì„œë“œ</th>
				<th scope="col">xhr</th>
				<th scope="col">jsonp</th>
				<th scope="col">flash</th>
				<th scope="col">iframe</th>
			</thead>
			<tbody>
				<tr>
					<td class="txt bold">abort</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
				</tr>
				<tr>
					<td class="txt bold">isIdle</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
				</tr>
				<tr>
					<td class="txt bold">option</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
				</tr>
				<tr>
					<td class="txt bold">request</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
					<td>O</td>
				</tr>
				<tr>
					<td class="txt bold">header</td>
					<td>O</td>
					<td>X</td>
					<td>O</td>
					<td>O</td>
				</tr>
			</tbody>
		</table>
	@see nv.$Ajax.Response
	@see http://dev.naver.com/projects/nv/wiki/cross%20domain%20ajax Cross Domain Ajax ì´í•´
	@example
		// 'Get List' ë²„íŠ¼ í´ë¦­ ì‹œ, ì„œë²„ì—ì„œ ë°ì´í„°ë¥¼ ë°›ì•„ì™€ ë¦¬ìŠ¤íŠ¸ë¥¼ êµ¬ì„±í•˜ëŠ” ì˜ˆì œ
		// (1) ì„œë²„ íŽ˜ì´ì§€ì™€ ì„œë¹„ìŠ¤ íŽ˜ì´ì§€ê°€ ê°™ì€ ë„ë©”ì¸ì— ìžˆëŠ” ê²½ìš° - xhr
		
		// [client.html]
		<!DOCTYPE html>
		<html>
			<head>
				<title>Ajax Sample</title>
				<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
				<script type="text/javascript" language="javascript" src="lib/nv.all.js"></script>
				<script type="text/javascript" language="javascript">
					function getList() {
						var oAjax = new $Ajax('server.php', {
							type : 'xhr',
							method : 'get',			// GET ë°©ì‹ìœ¼ë¡œ í†µì‹ 
							onload : function(res){	// ìš”ì²­ì´ ì™„ë£Œë˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜
								$('list').innerHTML = res.text();
							},
							timeout : 3,			// 3ì´ˆ ì´ë‚´ì— ìš”ì²­ì´ ì™„ë£Œë˜ì§€ ì•Šìœ¼ë©´ ontimeout ì‹¤í–‰ (ìƒëžµ ì‹œ 0)
							ontimeout : function(){	// íƒ€ìž„ ì•„ì›ƒì´ ë°œìƒí•˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜, ìƒëžµ ì‹œ íƒ€ìž„ ì•„ì›ƒì´ ë˜ë©´ ì•„ë¬´ ì²˜ë¦¬ë„ í•˜ì§€ ì•ŠìŒ
								alert("Timeout!");
							},
							async : true			// ë¹„ë™ê¸°ë¡œ í˜¸ì¶œí•˜ëŠ” ê²½ìš°, ìƒëžµí•˜ë©´ true
						});
						oAjax.request();
					}
				</script>
			</head>
			<body>
				<button onclick="getList(); return false;">Get List</button>
		
				<ul id="list">
		
				</ul>
			</body>
		</html>
		
		// [server.php]
		<?php
			echo "<li>ì²«ë²ˆì§¸</li><li>ë‘ë²ˆì§¸</li><li>ì„¸ë²ˆì§¸</li>";
		?>
	
	@example
		// 'Get List' ë²„íŠ¼ í´ë¦­ ì‹œ, ì„œë²„ì—ì„œ ë°ì´í„°ë¥¼ ë°›ì•„ì™€ ë¦¬ìŠ¤íŠ¸ë¥¼ êµ¬ì„±í•˜ëŠ” ì˜ˆì œ
		// (1-1) ì„œë²„ íŽ˜ì´ì§€ì™€ ì„œë¹„ìŠ¤ íŽ˜ì´ì§€ê°€ ë‹¤ë¥¸ ë„ë©”ì¸ì— ìžˆëŠ” ê²½ìš° - xhr
		
		// [http://nv.com/client.html]
		<!DOCTYPE html>
		<html>
			<head>
				<title>Ajax Sample</title>
				<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
				<script type="text/javascript" language="javascript" src="lib/nv.all.js"></script>
				<script type="text/javascript" language="javascript">
					function getList() {
						var oAjax = new $Ajax('http://server.com/some/server.php', {
							type : 'xhr',
							method : 'get',			// GET ë°©ì‹ìœ¼ë¡œ í†µì‹ 
							withCredentials : true, // ì¿ í‚¤ë¥¼ í¬í•¨í•˜ì—¬ ì„¤ì •
							onload : function(res){	// ìš”ì²­ì´ ì™„ë£Œë˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜
								$('list').innerHTML = res.text();
							}
						});
						oAjax.request();
					}
				</script>
			</head>
			<body>
				<button onclick="getList(); return false;">Get List</button>
		
				<ul id="list">
		
				</ul>
			</body>
		</html>
		
		// [server.php]
		 <?
		 	header("Access-Control-Allow-Origin: http://nv.com"); // í¬ë¡œìŠ¤ë„ë©”ì¸ìœ¼ë¡œ í˜¸ì¶œì´ ê°€ëŠ¥í•œ ê³³ì„ ë“±ë¡.
			header("Access-Control-Allow-Credentials: true"); // ì¿ í‚¤ë¥¼ í—ˆìš©í•  ê²½ìš°.
			
			echo "<li>ì²«ë²ˆì§¸</li><li>ë‘ë²ˆì§¸</li><li>ì„¸ë²ˆì§¸</li>";
		?>
	
	@example
		// 'Get List' ë²„íŠ¼ í´ë¦­ ì‹œ, ì„œë²„ì—ì„œ ë°ì´í„°ë¥¼ ë°›ì•„ì™€ ë¦¬ìŠ¤íŠ¸ë¥¼ êµ¬ì„±í•˜ëŠ” ì˜ˆì œ
		// (2) ì„œë²„ íŽ˜ì´ì§€ì™€ ì„œë¹„ìŠ¤ íŽ˜ì´ì§€ê°€ ê°™ì€ ë„ë©”ì¸ì— ìžˆëŠ” ê²½ìš° - iframe
		
		// [http://local.com/some/client.html]
		<!DOCTYPE html>
		<html>
			<head>
				<title>Ajax Sample</title>
				<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
				<script type="text/javascript" language="javascript" src="lib/nv.all.js"></script>
				<script type="text/javascript" language="javascript">
					function getList() {
						var oAjax = new $Ajax('http://server.com/some/some.php', {
							type : 'iframe',
							method : 'get',			// GET ë°©ì‹ìœ¼ë¡œ í†µì‹ 
													// POSTë¡œ ì§€ì •í•˜ë©´ ì›ê²© í”„ë¡ì‹œ íŒŒì¼ì—ì„œ some.php ë¡œ ìš”ì²­ ì‹œì— POST ë°©ì‹ìœ¼ë¡œ ì²˜ë¦¬
							onload : function(res){	// ìš”ì²­ì´ ì™„ë£Œë˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜
								$('list').innerHTML = res.text();
							},
							// ë¡œì»¬ í”„ë¡ì‹œ íŒŒì¼ì˜ ê²½ë¡œ.
							// ë°˜ë“œì‹œ ì •í™•í•œ ê²½ë¡œë¥¼ ì§€ì •í•´ì•¼ í•˜ë©°, ë¡œì»¬ ë„ë©”ì¸ì˜ ê²½ë¡œë¼ë©´ ì–´ë””ì— ë‘ì–´ë„ ìƒê´€ ì—†ìŒ
							// (â€» ì›ê²© í”„ë¡ì‹œ íŒŒì¼ì€ ë°˜ë“œì‹œ  ì›ê²© ë„ë©”ì¸ ì„œë²„ì˜ ë„ë©”ì¸ ë£¨íŠ¸ ìƒì— ë‘ì–´ì•¼ í•¨)
							proxy : 'http://local.naver.com/some/ajax_local_callback.html'
						});
						oAjax.request();
					}
		
				</script>
			</head>
			<body>
				<button onclick="getList(); return false;">Get List</button>
		
				<ul id="list">
		
				</ul>
			</body>
		</html>
		
		// [http://server.com/some/some.php]
		<?php
			echo "<li>ì²«ë²ˆì§¸</li><li>ë‘ë²ˆì§¸</li><li>ì„¸ë²ˆì§¸</li>";
		?>
	
	@example
		// 'Get List' ë²„íŠ¼ í´ë¦­ ì‹œ, ì„œë²„ì—ì„œ ë°ì´í„°ë¥¼ ë°›ì•„ì™€ ë¦¬ìŠ¤íŠ¸ë¥¼ êµ¬ì„±í•˜ëŠ” ì˜ˆì œ
		// (3) ì„œë²„ íŽ˜ì´ì§€ì™€ ì„œë¹„ìŠ¤ íŽ˜ì´ì§€ê°€ ê°™ì€ ë„ë©”ì¸ì— ìžˆëŠ” ê²½ìš° - jsonp
		
		// [http://local.com/some/client.html]
		<!DOCTYPE html>
		<html>
			<head>
				<title>Ajax Sample</title>
				<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
				<script type="text/javascript" language="javascript" src="lib/nv.all.js"></script>
				<script type="text/javascript" language="javascript">
					function getList(){
						var oAjax = new $Ajax('http://server.com/some/some.php', {
							type: 'jsonp',
							method: 'get',			// type ì´ jsonp ì´ë©´ get ìœ¼ë¡œ ì§€ì •í•˜ì§€ ì•Šì•„ë„ ìžë™ìœ¼ë¡œ get ìœ¼ë¡œ ì²˜ë¦¬í•¨ (ìƒëžµê°€ëŠ¥)
							jsonp_charset: 'utf-8',	// ìš”ì²­ ì‹œ ì‚¬ìš©í•  <script> ì¸ì½”ë”© ë°©ì‹ (ìƒëžµ ì‹œ utf-8)
							onload: function(res){	// ìš”ì²­ì´ ì™„ë£Œë˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜
								var response = res.json();
								var welList = $Element('list').empty();
		
								for (var i = 0, nLen = response.length; i < nLen; i++) {
									welList.append($("<li>" + response[i] + "</li>"));
								}
							},
							callbackid: '12345',				// ì½œë°± í•¨ìˆ˜ ì´ë¦„ì— ì‚¬ìš©í•  ì•„ì´ë”” ê°’ (ìƒëžµê°€ëŠ¥)
							callbackname: 'ajax_callback_fn'	// ì„œë²„ì—ì„œ ì‚¬ìš©í•  ì½œë°± í•¨ìˆ˜ì´ë¦„ì„ ê°€ì§€ëŠ” ë§¤ê°œ ë³€ìˆ˜ ì´ë¦„ (ìƒëžµ ì‹œ '_callback')
						});
						oAjax.request();
					}
				</script>
			</head>
			<body>
				<button onclick="getList(); return false;">Get List</button>
		
				<ul id="list">
		
				</ul>
			</body>
		</html>
		
		// [http://server.com/some/some.php]
		<?php
			$callbackName = $_GET['ajax_callback_fn'];
			echo $callbackName."(['ì²«ë²ˆì§¸','ë‘ë²ˆì§¸','ì„¸ë²ˆì§¸'])";
		?>
	
	@example
		// 'Get List' ë²„íŠ¼ í´ë¦­ ì‹œ, ì„œë²„ì—ì„œ ë°ì´í„°ë¥¼ ë°›ì•„ì™€ ë¦¬ìŠ¤íŠ¸ë¥¼ êµ¬ì„±í•˜ëŠ” ì˜ˆì œ
		// (4) ì„œë²„ íŽ˜ì´ì§€ì™€ ì„œë¹„ìŠ¤ íŽ˜ì´ì§€ê°€ ê°™ì€ ë„ë©”ì¸ì— ìžˆëŠ” ê²½ìš° - flash
		
		// [http://local.com/some/client.html]
		<!DOCTYPE html>
		<html>
			<head>
				<title>Ajax Sample</title>
				<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
				<script type="text/javascript" language="javascript" src="lib/nv.all.js"></script>
				<script type="text/javascript" language="javascript">
					function getList(){
						var oAjax = new $Ajax('http://server.com/some/some.php', {
							type : 'flash',
							method : 'get',			// GET ë°©ì‹ìœ¼ë¡œ í†µì‹ 
							sendheader : false,		// ìš”ì²­ í—¤ë”ë¥¼ ì „ì†¡í• ì§€ ì—¬ë¶€. (ìƒëžµ ì‹œ true)
							decode : true,			// ìš”ì²­í•œ ë°ì´í„° ì•ˆì— utf-8 ì´ ì•„ë‹Œ ë‹¤ë¥¸ ì¸ì½”ë”©ì´ ë˜ì–´ ìžˆì„ë•Œ false. (ìƒëžµ ì‹œ true)
							onload : function(res){	// ìš”ì²­ì´ ì™„ë£Œë˜ë©´ ì‹¤í–‰ë  ì½œë°± í•¨ìˆ˜
								$('list').innerHTML = res.text();
							},
						});
						oAjax.request();
					}
				</script>
			</head>
			<body>
				<script type="text/javascript">
					$Ajax.SWFRequest.write("swf/ajax.swf");	// Ajax í˜¸ì¶œì„ í•˜ê¸° ì „ì— ë°˜ë“œì‹œ í”Œëž˜ì‹œ ê°ì²´ë¥¼ ì´ˆê¸°í™”
				</script>
				<button onclick="getList(); return false;">Get List</button>
		
				<ul id="list">
		
				</ul>
			</body>
		</html>
		
		// [http://server.com/some/some.php]
		<?php
			echo "<li>ì²«ë²ˆì§¸</li><li>ë‘ë²ˆì§¸</li><li>ì„¸ë²ˆì§¸</li>";
		?>
 */
nv.$Ajax = function (url, option) {
	var cl = arguments.callee;

	if (!(this instanceof cl)){
		try {
			nv.$Jindo._maxWarn(arguments.length, 2,"$Ajax");
			return new cl(url, option||{});
		} catch(e) {
			if (e instanceof TypeError) { return null; }
			throw e;
		}
	}	

	var ___ajax = nv.$Ajax, ___error = nv.$Error, ___except = nv.$Except;
	var oArgs = g_checkVarType(arguments, {
		'4str' : [ 'sURL:String+' ],
		'4obj' : [ 'sURL:String+', 'oOption:Hash+' ]
	},"$Ajax");
		
	if(oArgs+"" == "for_string"){
		oArgs.oOption = {};
	}
	
	function _getXHR(sUrl) {
        var xhr = window.XMLHttpRequest && new XMLHttpRequest();

        if(this._checkCORSUrl(this._url)) {
            if(xhr && "withCredentials" in xhr) {
                return xhr;

            // for IE8 and 9 CORS call can be used right through 'XDomainRequest' object - http://msdn.microsoft.com/en-us/library/ie/cc288060(v=vs.85).aspx
            // Limitations - http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
            } else if(window.XDomainRequest) {
                this._bXDomainRequest = true;
                return new XDomainRequest();
            }
        } else {
            if(xhr) {
                return xhr;
            } else if(window.ActiveXObject) {
                try {
                    return new ActiveXObject('MSXML2.XMLHTTP');
                }catch(e) {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                }
            }
        }

        return null;
	}

	var loc = location.toString();
	var domain = '';
	try { domain = loc.match(/^https?:\/\/([a-z0-9_\-\.]+)/i)[1]; } catch(e) {}
	
	this._status = 0;
	this._url = oArgs.sURL;
	this._headers  = {};
	this._options = {
		type   :"xhr",
		method :"post",
		proxy  :"",
		timeout:0,
		onload :function(req){},
		onerror :null,
		ontimeout:function(req){},
		jsonp_charset : "utf-8",
		callbackid : "",
		callbackname : "",
		sendheader : true,
		async : true,
		decode :true,
		postBody :false,
        withCredentials:false
	};

	this._options = ___ajax._setProperties(oArgs.oOption,this);
	___ajax._validationOption(this._options,"$Ajax");
	
	/*
	 í…ŒìŠ¤íŠ¸ë¥¼ ìœ„í•´ ìš°ì„  ì ìš©ê°€ëŠ¥í•œ ì„¤ì • ê°ì²´ê°€ ì¡´ìž¬í•˜ë©´ ì ìš©
	 */
	if(___ajax.CONFIG){
		this.option(___ajax.CONFIG);
	}

	var _opt = this._options;
	
	_opt.type   = _opt.type.toLowerCase();
	_opt.method = _opt.method.toLowerCase();

	if (window["__"+nv._p_.nvName+"_callback"] === undefined) {
		window["__"+nv._p_.nvName+"_callback"] = [];
		// JINDOSUS-1412
		window["__"+nv._p_.nvName+"2_callback"] = [];
	}

	var t = this;
	switch (_opt.type) {
		case "put":
		case "delete":
		case "get":
		case "post":
			_opt.method = _opt.type;
            // 'break' statement was intentionally omitted.
		case "xhr":
			//-@@$Ajax.xhr-@@//
			this._request = _getXHR.call(this);
        	this._checkCORS(this._url,_opt.type,"");
			break;
		case "flash":
			//-@@$Ajax.flash-@@//
			if(!___ajax.SWFRequest) throw new ___error(nv._p_.nvName+'.$Ajax.SWFRequest'+___except.REQUIRE_AJAX, "$Ajax");
			
			this._request = new ___ajax.SWFRequest( function(name,value){return t.option.apply(t, arguments);} );
			break;
		case "jsonp":
			//-@@$Ajax.jsonp-@@//
			if(!___ajax.JSONPRequest) throw new ___error(nv._p_.nvName+'.$Ajax.JSONPRequest'+___except.REQUIRE_AJAX, "$Ajax");
			this._request = new ___ajax.JSONPRequest( function(name,value){return t.option.apply(t, arguments);} );
			break;
		case "iframe":
			//-@@$Ajax.iframe-@@//
			if(!___ajax.FrameRequest) throw new ___error(nv._p_.nvName+'.$Ajax.FrameRequest'+___except.REQUIRE_AJAX, "$Ajax");
			this._request = new ___ajax.FrameRequest( function(name,value){return t.option.apply(t, arguments);} );
	}
};

nv.$Ajax.prototype._checkCORSUrl = function (sUrl) {
    return /^http/.test(sUrl) && !new RegExp("^https?://"+ window.location.host, "i").test(sUrl);
};

nv.$Ajax.prototype._checkCORS = function(sUrl,sType,sMethod){
	this._bCORS = false;

	if(this._checkCORSUrl(sUrl) && sType === "xhr") {
		if(this._request && (this._bXDomainRequest || "withCredentials" in this._request)) {
		    this._bCORS = true;
		} else {
			throw new nv.$Error(nv.$Except.NOT_SUPPORT_CORS, "$Ajax"+sMethod);
		}
	}
};

nv.$Ajax._setProperties = function (option, context){
	option = option||{};
	var type;
	if((option.type=="put"||option.type=="delete"||option.type=="get"||option.type=="post")&&!option.method){
	    option.method = option.type;
	    type = option.type = "xhr";
	}
	
	type = option.type = (option.type||"xhr");
	option.onload = nv.$Fn(option.onload||function(){},context).bind();
	option.method = option.method ||"post";
	if(type != "iframe"){
		option.timeout = option.timeout||0;
		option.ontimeout = nv.$Fn(option.ontimeout||function(){},context).bind();
		option.onerror = nv.$Fn(option.onerror||function(){},context).bind();
	}
	if(type == "xhr"){
		option.async = option.async === undefined?true:option.async;
		option.postBody = option.postBody === undefined?false:option.postBody;
        option.withCredentials = option.withCredentials === undefined?false:option.withCredentials;
	}else if(type == "jsonp"){
		option.method = "get";
		option.jsonp_charset = option.jsonp_charset ||"utf-8";
		option.callbackid = option.callbackid ||"";
		option.callbackname = option.callbackname ||"";
	}else if(type == "flash"){
		option.sendheader =  option.sendheader === undefined ? true : option.sendheader;
		option.decode =  option.decode === undefined ? true : option.decode;
	}else if(type == "iframe"){
		option.proxy = option.proxy||"";
	}
	return option;
};

nv.$Ajax._validationOption = function(oOption,sMethod){
	var ___except = nv.$Except;
	var sType = oOption.type;
	if(sType === "jsonp"){
		if(oOption["method"] !== "get") nv.$Jindo._warn(___except.CANNOT_USE_OPTION+"\n\t"+sMethod+"-method="+oOption["method"]);
	}else if(sType === "flash"){
		if(!(oOption["method"] === "get" || oOption["method"] === "post")) nv.$Jindo._warn(___except.CANNOT_USE_OPTION+"\n\t"+sMethod+"-method="+oOption["method"]);
	}
	
	if(oOption["postBody"]){
		if(!(sType === "xhr" && (oOption["method"]!=="get"))){
			nv.$Jindo._warn(___except.CANNOT_USE_OPTION+"\n\t"+oOption["method"]+"-postBody="+oOption["postBody"]);
		}
	}
	
	var oTypeProperty = {
			"xhr": "onload|timeout|ontimeout|onerror|async|method|postBody|type|withCredentials",
			"jsonp": "onload|timeout|ontimeout|onerror|jsonp_charset|callbackid|callbackname|method|type",
			"flash": "onload|timeout|ontimeout|onerror|sendheader|decode|method|type",
			"iframe": "onload|proxy|method|type"
	}, aName = [], i = 0;

    for(var x in oOption) { aName[i++] = x; }
	var sProperty = oTypeProperty[sType] || "";
	
	for(var i = 0 ,l = aName.length; i < l ; i++){
		if(sProperty.indexOf(aName[i]) == -1) nv.$Jindo._warn(___except.CANNOT_USE_OPTION+"\n\t"+sType+"-"+aName[i]);
	}
};
/**
 * @ignore
 */
nv.$Ajax.prototype._onload = (function(isIE) {
	var ___ajax = nv.$Ajax;
	var cache = nv.$Jindo;

	if(isIE){
		return function() {
			var status = this._request.status;
			var bSuccess = this._request.readyState == 4 &&  (status == 200||status == 0) || (this._bXDomainRequest && !!this._request.responseText);
			var oResult;
			if (this._request.readyState == 4 || this._bXDomainRequest) {
				try {
						if ((!bSuccess) && cache.isFunction(this._options.onerror)){
							this._options.onerror(new ___ajax.Response(this._request));
						}else{
							if(!this._is_abort){
								oResult = this._options.onload(new ___ajax.Response(this._request));	
							}
						} 
				}catch(e){
					throw e;
				}finally{
					if(cache.isFunction(this._oncompleted)){
						this._oncompleted(bSuccess, oResult);
					}
					if (this._options.type == "xhr" ){
						this.abort();
						try { delete this._request.onload; } catch(e) { this._request.onload =undefined;} 
					}
					this._request.onreadystatechange && delete this._request.onreadystatechange;
					
				}
			}
		};
	}else{
		return function() {
			var status = this._request.status;
			var bSuccess = this._request.readyState == 4 &&  (status == 200||status == 0);
			var oResult;
			if (this._request.readyState == 4) {
				try {
				  		
						if ((!bSuccess) && cache.isFunction(this._options.onerror)){
							this._options.onerror(new ___ajax.Response(this._request));
						}else{
							oResult = this._options.onload(new ___ajax.Response(this._request));
						} 
				}catch(e){
					throw e;
				}finally{
					this._status--;
					if(cache.isFunction(this._oncompleted)){
						this._oncompleted(bSuccess, oResult);
					} 
				}
			}
		};
	}
})(nv._p_._JINDO_IS_IE);


/**
	request() ë©”ì„œë“œëŠ” Ajax ìš”ì²­ì„ ì„œë²„ì— ì „ì†¡í•œë‹¤. ìš”ì²­ì— ì‚¬ìš©í•  íŒŒë¼ë¯¸í„°ëŠ” nv.$Ajax() ê°ì²´ ìƒì„±ìžì—ì„œ ì„¤ì •í•˜ê±°ë‚˜ option() ë©”ì„œë“œë¥¼ ì‚¬ìš©í•˜ì—¬ ë³€ê²½í•  ìˆ˜ ìžˆë‹¤. 
	ìš”ì²­ íƒ€ìž…(type)ì´ "flash"ë©´ ì´ ë©”ì„œë“œë¥¼ ì‹¤í–‰í•˜ê¸° ì „ì— body ìš”ì†Œì—ì„œ <auidoc:see content="nv.$Ajax.SWFRequest#write"/>() ë©”ì„œë“œë¥¼ ë°˜ë“œì‹œ ì‹¤í–‰í•´ì•¼ í•œë‹¤.
	
	@method request
	@syntax oData
	@syntax oData2
	@param {String+} [oData] ì„œë²„ë¡œ ì „ì†¡í•  ë°ì´í„°. (postbodyê°€ true, typeì´ xhr, methodê°€ getì´ ì•„ë‹Œ ê²½ìš°ë§Œ ì‚¬ìš©ê°€ëŠ¥)
	@param {Hash+} oData2 ì„œë²„ë¡œ ì „ì†¡í•  ë°ì´í„°.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Ajax#option
	@see nv.$Ajax.SWFRequest#write
	@example
		var ajax = $Ajax("http://www.remote.com", {
		   onload : function(res) {
		      // onload í•¸ë“¤ëŸ¬
		   }
		});
		
		ajax.request( {key1:"value1", key2:"value2"} );	// ì„œë²„ì— ì „ì†¡í•  ë°ì´í„°ë¥¼ ë§¤ê°œë³€ìˆ˜ë¡œ ë„˜ê¸´ë‹¤.
		ajax.request( );
	
	@example
		var ajax2 = $Ajax("http://www.remote.com", {
		   type : "xhr",
		   method : "post",
		   postBody : true
		});
		
		ajax2.request({key1:"value1", key2:"value2"});
		ajax2.request("{key1:\"value1\", key2:\"value2\"}");
 */
nv.$Ajax.prototype.request = function(oData) {
	var cache = nv.$Jindo;
	var oArgs = cache.checkVarType(arguments, {
		'4voi' : [ ],
		'4obj' : [ cache._F('oData:Hash+') ],
		'4str' : [ 'sData:String+' ]
	},"$Ajax#request");
	
	this._status++;
	var t   = this;
	var req = this._request;
	var opt = this._options;
	var v,a = [], data = "";
	var _timer = null;
	var url = this._url;
	this._is_abort = false;
	var sUpType = opt.type.toUpperCase();
	var sUpMethod = opt.method.toUpperCase();
	if (opt.postBody && sUpType == "XHR" && sUpMethod != "GET") {
		if(oArgs+"" == "4str"){
			data = oArgs.sData;
		}else if(oArgs+"" == "4obj"){
			data = nv.$Json(oArgs.oData).toString();	
		}else{
			data = null;
		}
	}else{
		switch(oArgs+""){
			case "4voi" : 
				data = null;
				break;
			case "4obj":
				var oData = oArgs.oData;
				for(var k in oData) {
					if(oData.hasOwnProperty(k)){
						v = oData[k];
						if (cache.isFunction(v)) v = v();
						
						if (cache.isArray(v) || (nv.$A && v instanceof nv.$A)) {
							if(v instanceof nv.$A) v = v._array;
							
							for(var i=0; i < v.length; i++) {
								a[a.length] = k+"="+encodeURIComponent(v[i]);
							}
						} else {
							a[a.length] = k+"="+encodeURIComponent(v);
						}
					}
				}
				data = a.join("&");
		}
	}
	
	/*
	 XHR GET ë°©ì‹ ìš”ì²­ì¸ ê²½ìš° URLì— íŒŒë¼ë¯¸í„° ì¶”ê°€
	 */
	if(data && sUpType=="XHR" && sUpMethod=="GET"){
		if(url.indexOf('?')==-1){
			url += "?";
		} else {
			url += "&";			
		}
		url += data;
		data = null;
	}

	if(sUpType=="XHR"){
		req.open(sUpMethod, url, !!opt.async);
	}else{
		req.open(sUpMethod, url);
	}

	if(opt.withCredentials){
		req.withCredentials = true;
	}

	if(sUpType=="XHR"&&sUpMethod=="POST"&&req.setRequestHeader){
		/*
		 xhrì¸ ê²½ìš° IEì—ì„œëŠ” GETìœ¼ë¡œ ë³´ë‚¼ ë•Œ ë¸Œë¼ìš°ì ¸ì—ì„œ ìžì²´ cacheí•˜ì—¬ cacheì„ ì•ˆë˜ê²Œ ìˆ˜ì •.
		 */
		req.setRequestHeader("If-Modified-Since", "Thu, 1 Jan 1970 00:00:00 GMT");
	} 
	if ((sUpType=="XHR"||sUpType=="IFRAME"||(sUpType=="FLASH"&&opt.sendheader)) && req.setRequestHeader) {
		if(!this._headers["Content-Type"]){
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
		}
		req.setRequestHeader("charset", "utf-8");
		if(!this._bCORS&&!this._headers["X-Requested-With"]){
			req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		}
		for (var x in this._headers) {
			if(this._headers.hasOwnProperty(x)){
				if (typeof this._headers[x] == "function") 
					continue;
				req.setRequestHeader(x, String(this._headers[x]));
			}
		}
	}
	if(req.addEventListener&&!nv._p_._JINDO_IS_OP&&!nv._p_._JINDO_IS_IE){
		/*
		  * opera 10.60ì—ì„œ XMLHttpRequestì— addEventListenerê¸° ì¶”ê°€ë˜ì—ˆì§€ë§Œ ì •ìƒì ìœ¼ë¡œ ë™ìž‘í•˜ì§€ ì•Šì•„ operaëŠ” ë¬´ì¡°ê±´ dom1ë°©ì‹ìœ¼ë¡œ ì§€ì›í•¨.
 * IE9ì—ì„œë„ operaì™€ ê°™ì€ ë¬¸ì œê°€ ìžˆìŒ.
		 */
		if(this._loadFunc){ req.removeEventListener("load", this._loadFunc, false); }
		this._loadFunc = function(rq){ 
			clearTimeout(_timer);
			_timer = undefined; 
			t._onload(rq); 
		};
		req.addEventListener("load", this._loadFunc, false);
	}else{
		if (req.onload !== undefined) {
			req.onload = function(rq){
				if((req.readyState == 4 || t._bXDomainRequest) && !t._is_abort){
					clearTimeout(_timer); 
					_timer = undefined;
					t._onload(rq);
				}
			};
		} else {
            /*
             * IE6ì—ì„œëŠ” onreadystatechangeê°€ ë™ê¸°ì ìœ¼ë¡œ ì‹¤í–‰ë˜ì–´ timeoutì´ë²¤íŠ¸ê°€ ë°œìƒì•ˆë¨.
 * ê·¸ëž˜ì„œ intervalë¡œ ì²´í¬í•˜ì—¬ timeoutì´ë²¤íŠ¸ê°€ ì •ìƒì ìœ¼ë¡œ ë°œìƒë˜ë„ë¡ ìˆ˜ì •. ë¹„ë™ê¸° ë°©ì‹ì¼ë•Œë§Œ
             */
            var iePattern = nv._p_._j_ag.match(/(?:MSIE) ([0-9.]+)/);
			if(iePattern&&iePattern[1]==6&&opt.async){
				var onreadystatechange = function(rq){
					if(req.readyState == 4 && !t._is_abort){
						if(_timer){
							clearTimeout(_timer);
							_timer = undefined;
						}
						t._onload(rq);
						clearInterval(t._interval);
						t._interval = undefined;
					}
				};
				this._interval = setInterval(onreadystatechange,300);

			}else{
				req.onreadystatechange = function(rq){
					if(req.readyState == 4){
						clearTimeout(_timer); 
						_timer = undefined;
						t._onload(rq);
					}
				};
			}
		}
	}

	if (opt.timeout > 0) {
		if(this._timer) clearTimeout(this._timer);
		
		_timer = setTimeout(function(){
			t._is_abort = true;
			if(t._interval){
				clearInterval(t._interval);
				t._interval = undefined;
			}
			try { req.abort(); } catch(e){}

			opt.ontimeout(req);	
			if(cache.isFunction(t._oncompleted)) t._oncompleted(false);
		}, opt.timeout * 1000 );

		this._timer = _timer;
	}
	/*
	 * testì„ í•˜ê¸° ìœ„í•œ url
	 */
	this._test_url = url;
	req.send(data);

	return this;
};

/**
	isIdle() ë©”ì„œë“œëŠ” nv.$Ajax() ê°ì²´ê°€ í˜„ìž¬ ìš”ì²­ ëŒ€ê¸° ìƒíƒœì¸ì§€ í™•ì¸í•œë‹¤.
	
	@method isIdle
	@return {Boolean} í˜„ìž¬ ëŒ€ê¸° ì¤‘ì´ë©´ true ë¥¼, ê·¸ë ‡ì§€ ì•Šìœ¼ë©´ falseë¥¼ ë¦¬í„´í•œë‹¤.
	@since 1.3.5
	@example
		var ajax = $Ajax("http://www.remote.com",{
		     onload : function(res){
		         // onload í•¸ë“¤ëŸ¬
		     }
		});
		
		if(ajax.isIdle()) ajax.request();
 */
nv.$Ajax.prototype.isIdle = function(){
	return this._status==0;
};

/**
	abort() ë©”ì„œë“œëŠ” ì„œë²„ë¡œ ì „ì†¡í•œ Ajax ìš”ì²­ì„ ì·¨ì†Œí•œë‹¤. Ajax ìš”ì²­ì˜ ì‘ë‹µ ì‹œê°„ì´ ê¸¸ê±°ë‚˜ ê°•ì œë¡œ Ajax ìš”ì²­ì„ ì·¨ì†Œí•  ê²½ìš° ì‚¬ìš©í•œë‹¤.
	
	@method abort
	@remark typeì´ jsonpì¼ ê²½ìš° abortë¥¼ í•´ë„ ìš”ì²­ì„ ë©ˆì¶”ì§„ ì•ŠëŠ”ë‹¤.
	@return {this} ì „ì†¡ì„ ì·¨ì†Œí•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@example
		var ajax = $Ajax("http://www.remote.com", {
			timeout : 3,
			ontimeout : function() {
				stopRequest();
			}
			onload : function(res) {
				// onload í•¸ë“¤ëŸ¬
			}
		}).request( {key1:"value1", key2:"value2"} );
		
		function stopRequest() {
		    ajax.abort();
		}
 */
nv.$Ajax.prototype.abort = function() {
	try {
		if(this._interval) clearInterval(this._interval);
		if(this._timer) clearTimeout(this._timer);
		this._interval = undefined;
		this._timer = undefined;
		this._is_abort = true;
		this._request.abort();
	}finally{
		this._status--;
	}

	return this;
};

/**
	url()ë©”ì„œë“œëŠ” urlì„ ë°˜í™˜í•œë‹¤.
	
	@method url
	@return {String} URLì˜ ê°’.
	@since 2.0.0
 */
/**
	url()ë©”ì„œë“œëŠ” urlì„ ë³€ê²½í•œë‹¤.
	
	@method url
	@param {String+} url
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@since 2.0.0
 */
nv.$Ajax.prototype.url = function(sURL){
	var oArgs = g_checkVarType(arguments, {
		'g' : [ ],
		's' : [ 'sURL:String+' ]
	},"$Ajax#url");
	
	switch(oArgs+"") {
		case 'g':
	    	return this._url;
		case 's':
		    this._checkCORS(oArgs.sURL,this._options.type,"#url");
	    	this._url = oArgs.sURL;
			return this;
			
	}
};
/**
	option() ë©”ì„œë“œëŠ” nv.$Ajax() ê°ì²´ì˜ ì˜µì…˜ ê°ì²´(oOption) ì†ì„±ì— ì •ì˜ëœ Ajax ìš”ì²­ ì˜µì…˜ì— ëŒ€í•œ ì •ë³´ë¥¼ ê°€ì ¸ì˜¨ë‹¤.
	
	@method option
	@param {String+} sName ì˜µì…˜ ê°ì²´ì˜ ì†ì„± ì´ë¦„
	@return {Variant} í•´ë‹¹ ì˜µì…˜ì— í•´ë‹¹í•˜ëŠ” ê°’.
	@throws {nv.$Except.CANNOT_USE_OPTION} í•´ë‹¹ íƒ€ìž…ì— ì ì ˆí•œ ì˜µì…˜ì´ ì•„ë‹Œ ê²½ìš°.
 */
/**
	option() ë©”ì„œë“œëŠ” nv.$Ajax() ê°ì²´ì˜ ì˜µì…˜ ê°ì²´(oOption) ì†ì„±ì— ì •ì˜ëœ Ajax ìš”ì²­ ì˜µì…˜ì— ëŒ€í•œ ì •ë³´ë¥¼ ì„¤ì •í•œë‹¤. Ajax ìš”ì²­ ì˜µì…˜ì„ ì„¤ì •í•˜ë ¤ë©´ ì´ë¦„ê³¼ ê°’ì„, í˜¹ì€ ì´ë¦„ê³¼ ê°’ì„ ì›ì†Œë¡œ ê°€ì§€ëŠ” í•˜ë‚˜ì˜ ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥í•œë‹¤. ì´ë¦„ê³¼ ê°’ì„ ì›ì†Œë¡œ ê°€ì§€ëŠ” ê°ì²´ë¥¼ ìž…ë ¥í•˜ë©´ í•˜ë‚˜ ì´ìƒì˜ ì •ë³´ë¥¼ í•œ ë²ˆì— ì„¤ì •í•  ìˆ˜ ìžˆë‹¤.
	
	@method option
	@syntax sName, vValue
	@syntax oOption
	@param {String+} sName ì˜µì…˜ ê°ì²´ì˜ ì†ì„± ì´ë¦„
	@param {Variant} vValue ìƒˆë¡œ ì„¤ì •í•  ì˜µì…˜ ì†ì„±ì˜ ê°’.
	@param {Hash+} oOption ì†ì„± ê°’ì´ ì •ì˜ëœ ê°ì²´.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@throws {nv.$Except.CANNOT_USE_OPTION} í•´ë‹¹ íƒ€ìž…ì— ì ì ˆí•œ ì˜µì…˜ì´ ì•„ë‹Œ ê²½ìš°.
	@example
		var ajax = $Ajax("http://www.remote.com", {
			type : "xhr",
			method : "get",
			onload : function(res) {
				// onload í•¸ë“¤ëŸ¬
			}
		});
		
		var request_type = ajax.option("type");					// type ì¸ xhr ì„ ë¦¬í„´í•œë‹¤.
		ajax.option("method", "post");							// method ë¥¼ post ë¡œ ì„¤ì •í•œë‹¤.
		ajax.option( { timeout : 0, onload : handler_func } );	// timeout ì„ ìœ¼ë¡œ, onload ë¥¼ handler_func ë¡œ ì„¤ì •í•œë‹¤.
 */
nv.$Ajax.prototype.option = function(name, value) {
	var oArgs = g_checkVarType(arguments, {
		's4var' : [ 'sKey:String+', 'vValue:Variant' ],
		's4obj' : [ 'oOption:Hash+'],
		'g' : [ 'sKey:String+']
	},"$Ajax#option");
	
	switch(oArgs+"") {
		case "s4var":
			oArgs.oOption = {};
			oArgs.oOption[oArgs.sKey] = oArgs.vValue;
			// 'break' statement was intentionally omitted.
		case "s4obj":
			var oOption = oArgs.oOption;
			try {
				for (var x in oOption) {
					if (oOption.hasOwnProperty(x)){
						if(x==="onload"||x==="ontimeout"||x==="onerror"){
							this._options[x] = nv.$Fn(oOption[x],this).bind(); 
						}else{
							this._options[x] = oOption[x];	
						}		
					}
				}
			}catch (e) {}
			break;
		case 'g':
			return this._options[oArgs.sKey];
			
	}
	this._checkCORS(this._url,this._options.type,"#option");
	nv.$Ajax._validationOption(this._options,"$Ajax#option");

	return this;
};

/**
	header() ë©”ì„œë“œëŠ” Ajax ìš”ì²­ì—ì„œ ì‚¬ìš©í•  HTTP ìš”ì²­ í—¤ë”ë¥¼ ê°€ì ¸ì˜¨ë‹¤. í—¤ë”ì—ì„œ íŠ¹ì • ì†ì„± ê°’ì„ ê°€ì ¸ì˜¤ë ¤ë©´ ì†ì„±ì˜ ì´ë¦„ì„ íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥í•œë‹¤.
	
	@method header
	@param {String+} vName í—¤ë” ì´ë¦„
	@return {String} ë¬¸ìžì—´ì„ ë°˜í™˜í•œë‹¤.
	@example
		var customheader = ajax.header("myHeader"); 		// HTTP ìš”ì²­ í—¤ë”ì—ì„œ myHeader ì˜ ê°’
 */
/**
	header() ë©”ì„œë“œëŠ” Ajax ìš”ì²­ì—ì„œ ì‚¬ìš©í•  HTTP ìš”ì²­ í—¤ë”ë¥¼ ì„¤ì •í•œë‹¤. í—¤ë”ë¥¼ ì„¤ì •í•˜ë ¤ë©´ í—¤ë”ì˜ ì´ë¦„ê³¼ ê°’ì„ ê°ê° íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥í•˜ê±°ë‚˜ í—¤ë”ì˜ ì´ë¦„ê³¼ ê°’ì„ ì›ì†Œë¡œ ê°€ì§€ëŠ” ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥í•œë‹¤. ê°ì²´ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ìž…ë ¥í•˜ë©´ í•˜ë‚˜ ì´ìƒì˜ í—¤ë”ë¥¼ í•œ ë²ˆì— ì„¤ì •í•  ìˆ˜ ìžˆë‹¤.<br>
	(* IE8/9ì—ì„œ XDomainRequest ê°ì²´ë¥¼ ì‚¬ìš©í•œ CORS í˜¸ì¶œì—ì„œëŠ” ì‚¬ìš©í•  ìˆ˜ ì—†ë‹¤. XDomainRequestëŠ” í—¤ë”ë¥¼ ì„¤ì •í•  ìˆ˜ ìžˆëŠ” ë©”ì„œë“œê°€ ì¡´ìž¬í•˜ì§€ ì•ŠëŠ”ë‹¤.)
	
	@method header
	@syntax sName, sValue
	@syntax oHeader
	@param {String+} sName í—¤ë” ì´ë¦„
	@param {String+} sValue ì„¤ì •í•  í—¤ë” ê°’.
	@param {Hash+} oHeader í•˜ë‚˜ ì´ìƒì˜ í—¤ë” ê°’ì´ ì •ì˜ëœ ê°ì²´
	@return {this} í—¤ë” ê°’ì„ ì„¤ì •í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@throws {nv.$Except.CANNOT_USE_OPTION} jsonp íƒ€ìž…ì¼ ê²½ìš° headerë©”ì„œë“œë¥¼ ì‚¬ìš©ì‹œ í•  ë•Œ.
	@example
		ajax.header( "myHeader", "someValue" );				// HTTP ìš”ì²­ í—¤ë”ì˜ myHeader ë¥¼ someValue ë¡œ ì„¤ì •í•œë‹¤.
		ajax.header( { anotherHeader : "someValue2" } );	// HTTP ìš”ì²­ í—¤ë”ì˜ anotherHeader ë¥¼ someValue2 ë¡œ ì„¤ì •í•œë‹¤.
 */
nv.$Ajax.prototype.header = function(name, value) {
	if(this._options["type"]==="jsonp" || this._bXDomainRequest){nv.$Jindo._warn(nv.$Except.CANNOT_USE_HEADER);}
	
	var oArgs = g_checkVarType(arguments, {
		's4str' : [ 'sKey:String+', 'sValue:String+' ],
		's4obj' : [ 'oOption:Hash+' ],
		'g' : [ 'sKey:String+' ]
	},"$Ajax#option");
	
	switch(oArgs+"") {
		case 's4str':
			this._headers[oArgs.sKey] = oArgs.sValue;
			break;
		case 's4obj':
			var oOption = oArgs.oOption;
			try {
				for (var x in oOption) {
					if (oOption.hasOwnProperty(x)) 
						this._headers[x] = oOption[x];
				}
			} catch(e) {}
			break;
		case 'g':
			return this._headers[oArgs.sKey];
			
	}

	return this;
};

/**
	nv.$Ajax.Response() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤. nv.$Ajax.Response() ê°ì²´ëŠ” nv.$Ajax() ê°ì²´ì—ì„œ request() ë©”ì„œë“œì˜ ìš”ì²­ ì²˜ë¦¬ ì™„ë£Œí•œ í›„ ìƒì„±ëœë‹¤. nv.$Ajax() ê°ì²´ë¥¼ ìƒì„±í•  ë•Œ onload ì†ì„±ì— ì„¤ì •í•œ ì½œë°± í•¨ìˆ˜ì˜ íŒŒë¼ë¯¸í„°ë¡œ nv.$Ajax.Response() ê°ì²´ê°€ ì „ë‹¬ëœë‹¤.

	@class nv.$Ajax.Response
	@keyword ajaxresponse, ajax, response
 */
/**
	Ajax ì‘ë‹µ ê°ì²´ë¥¼ ëž˜í•‘í•˜ì—¬ ì‘ë‹µ ë°ì´í„°ë¥¼ ê°€ì ¸ì˜¤ê±°ë‚˜ í™œìš©í•˜ëŠ”ë° ìœ ìš©í•œ ê¸°ëŠ¥ì„ ì œê³µí•œë‹¤.
	
	@constructor
	@param {Hash+} oReq ìš”ì²­ ê°ì²´
	@see nv.$Ajax
 */
nv.$Ajax.Response  = function(req) {
	this._response = req;
	this._regSheild = /^for\(;;\);/;
};

/**
{{response_desc}}
 */
/**
/**
	xml() ë©”ì„œë“œëŠ” ì‘ë‹µì„ XML ê°ì²´ë¡œ ë°˜í™˜í•œë‹¤. XHRì˜ responseXML ì†ì„±ê³¼ ìœ ì‚¬í•˜ë‹¤.
	
	@method xml
	@return {Object} ì‘ë‹µ XML ê°ì²´. 
	@see https://developer.mozilla.org/en/XMLHttpRequest XMLHttpRequest - MDN Docs
	@example
		// some.xml
		<data>
			<li>ì²«ë²ˆì§¸</li>
			<li>ë‘ë²ˆì§¸</li>
			<li>ì„¸ë²ˆì§¸</li>
		</data>
		
		// client.html
		var oAjax = new $Ajax('some.xml', {
			type : 'xhr',
			method : 'get',
			onload : function(res){
				var elData = cssquery.getSingle('data', res.xml());	// ì‘ë‹µì„ XML ê°ì²´ë¡œ ë¦¬í„´í•œë‹¤
				$('list').innerHTML = elData.firstChild.nodeValue;
			},
		}).request();
 */
nv.$Ajax.Response.prototype.xml = function() {
	return this._response.responseXML;
};

/**
	text() ë©”ì„œë“œëŠ” ì‘ë‹µì„ ë¬¸ìžì—´(String)ë¡œ ë°˜í™˜í•œë‹¤. XHRì˜ responseText ì™€ ìœ ì‚¬í•˜ë‹¤.
	
	@method text
	@return {String} ì‘ë‹µ ë¬¸ìžì—´. 
	@see https://developer.mozilla.org/en/XMLHttpRequest XMLHttpRequest - MDN Docs
	@example
		// some.php
		<?php
			echo "<li>ì²«ë²ˆì§¸</li><li>ë‘ë²ˆì§¸</li><li>ì„¸ë²ˆì§¸</li>";
		?>
		
		// client.html
		var oAjax = new $Ajax('some.xml', {
			type : 'xhr',
			method : 'get',
			onload : function(res){
				$('list').innerHTML = res.text();	// ì‘ë‹µì„ ë¬¸ìžì—´ë¡œ ë¦¬í„´í•œë‹¤.
			},
		}).request();
 */
nv.$Ajax.Response.prototype.text = function() {
	return this._response.responseText.replace(this._regSheild, '');
};

/**
	status() ë©”ì„œë“œëŠ” HTTP ì‘ë‹µ ì½”ë“œë¥¼ ë°˜í™˜í•œë‹¤. HTTP ì‘ë‹µ ì½”ë“œí‘œë¥¼ ì°¸ê³ í•œë‹¤.
	
	@method status
	@return {Numeric} ì‘ë‹µ ì½”ë“œ.
	@see http://www.w3.org/Protocols/HTTP/HTRESP.html HTTP Status codes - W3C
	@example
		var oAjax = new $Ajax('some.php', {
			type : 'xhr',
			method : 'get',
			onload : function(res){
				if(res.status() == 200){	// HTTP ì‘ë‹µ ì½”ë“œë¥¼ í™•ì¸í•œë‹¤.
					$('list').innerHTML = res.text();
				}
			},
		}).request();
 */
nv.$Ajax.Response.prototype.status = function() {
	var status = this._response.status;
	return status==0?200:status;
};

/**
	readyState() ë©”ì„œë“œëŠ” ì‘ë‹µ ìƒíƒœ(readyState)ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method readyState
	@return {Numeric} readyState ê°’.
		@return .0 ìš”ì²­ì´ ì´ˆê¸°í™”ë˜ì§€ ì•Šì€ ìƒíƒœ (UNINITIALIZED)
		@return .1 ìš”ì²­ ì˜µì…˜ì„ ì„¤ì •í–ˆìœ¼ë‚˜, ìš”ì²­í•˜ì§€ ì•Šì€ ìƒíƒœ (LOADING)
		@return .2 ìš”ì²­ì„ ë³´ë‚´ê³  ì²˜ë¦¬ ì¤‘ì¸ ìƒíƒœ. ì´ ìƒíƒœì—ì„œ ì‘ë‹µ í—¤ë”ë¥¼ ì–»ì„ ìˆ˜ ìžˆë‹¤. (LOADED)
		@return .3 ìš”ì²­ì´ ì²˜ë¦¬ ì¤‘ì´ë©°, ë¶€ë¶„ì ì¸ ì‘ë‹µ ë°ì´í„°ë¥¼ ë°›ì€ ìƒíƒœ (INTERACTIVE)
		@return .4 ì‘ë‹µ ë°ì´í„°ë¥¼ ëª¨ë‘ ë°›ì•„ í†µì‹ ì„ ì™„ë£Œí•œ ìƒíƒœ (COMPLETED)
	@example
		var oAjax = new $Ajax('some.php', {
			type : 'xhr',
			method : 'get',
			onload : function(res){
				if(res.readyState() == 4){	// ì‘ë‹µì˜ readyState ë¥¼ í™•ì¸í•œë‹¤.
					$('list').innerHTML = res.text();
				}
			},
		}).request();
 */
nv.$Ajax.Response.prototype.readyState = function() {
	return this._response.readyState;
};

/**
	json() ë©”ì„œë“œëŠ” ì‘ë‹µì„ JSON ê°ì²´ë¡œ ë°˜í™˜í•œë‹¤. ì‘ë‹µ ë¬¸ìžì—´ì„ ìžë™ìœ¼ë¡œ JSON ê°ì²´ë¡œ ë³€í™˜í•˜ì—¬ ë°˜í™˜í•œë‹¤. ë³€í™˜ ê³¼ì •ì—ì„œ ì˜¤ë¥˜ê°€ ë°œìƒí•˜ë©´ ë¹ˆ ê°ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	
	@method json
	@return {Object} JSON ê°ì²´.
	@throws {nv.$Except.PARSE_ERROR} jsoníŒŒì‹±í•  ë•Œ ì—ëŸ¬ ë°œìƒí•œ ê²½ìš°.
	@example
		// some.php
		<?php
			echo "['ì²«ë²ˆì§¸', 'ë‘ë²ˆì§¸', 'ì„¸ë²ˆì§¸']";
		?>
		
		// client.html
		var oAjax = new $Ajax('some.php', {
			type : 'xhr',
			method : 'get',
			onload : function(res){
				var welList = $Element('list').empty();
				var jsonData = res.json();	// ì‘ë‹µì„ JSON ê°ì²´ë¡œ ë¦¬í„´í•œë‹¤
		
				for(var i = 0, nLen = jsonData.length; i < nLen; i++){
					welList.append($("<li>" + jsonData[i] + "</li>"));
				}
			},
		}).request();
 */
nv.$Ajax.Response.prototype.json = function() {
	if (this._response.responseJSON) {
		return this._response.responseJSON;
	} else if (this._response.responseText) {
		try {
			return eval("("+this.text()+")");
		} catch(e) {
			throw new nv.$Error(nv.$Except.PARSE_ERROR,"$Ajax#json");
		}
	}

	return {};
};

/**
	header() ë©”ì„œë“œëŠ” ì‘ë‹µ í—¤ë”ë¥¼ ê°€ì ¸ì˜¨ë‹¤.
	
	@method header
	@syntax sName
	@param {String+} [sName] ê°€ì ¸ì˜¬ ì‘ë‹µ í—¤ë”ì˜ ì´ë¦„. ì´ ì˜µì…˜ì„ ìž…ë ¥í•˜ì§€ ì•Šìœ¼ë©´ í—¤ë” ì „ì²´ë¥¼ ë°˜í™˜í•œë‹¤.
	@return {String | Object} í•´ë‹¹í•˜ëŠ” í—¤ë” ê°’(String) ë˜ëŠ” í—¤ë” ì „ì²´(Object)

	@example
		var oAjax = new $Ajax('some.php', {
			type : 'xhr',
			method : 'get',
			onload : function(res){
				res.header("Content-Length")	// ì‘ë‹µ í—¤ë”ì—ì„œ "Content-Length" ì˜ ê°’ì„ ë¦¬í„´í•œë‹¤.
			},
		}).request();
 */
nv.$Ajax.Response.prototype.header = function(name) {
	var oArgs = g_checkVarType(arguments, {
		'4str' : [ 'name:String+' ],
		'4voi' : [ ]
	},"$Ajax.Response#header");
	
	switch (oArgs+"") {
	case '4str':
		return this._response.getResponseHeader(name);
	case '4voi':
		return this._response.getAllResponseHeaders();
	}
};
//-!nv.$Ajax end!-//

/**
	@fileOverview $Ajaxì˜ í™•ìž¥ ë©”ì„œë“œë¥¼ ì •ì˜í•œ íŒŒì¼
	@name Ajax.extend.js
	@author NAVER Ajax Platform
 */

//-!nv.$Ajax.RequestBase start(nv.$Class,nv.$Ajax)!-//
/**
	Ajax ìš”ì²­ ê°ì²´ì˜ ê¸°ë³¸ ê°ì²´ì´ë‹¤.

	@class nv.$Ajax.RequestBase
	@ignore
 */
/**
	Ajax ìš”ì²­ íƒ€ìž… ë³„ë¡œ Ajax ìš”ì²­ ê°ì²´ë¥¼ ìƒì„±í•  ë•Œ Ajax ìš”ì²­ ê°ì²´ë¥¼ ìƒì„±í•˜ê¸° ìœ„í•œ ìƒìœ„ ê°ì²´ë¡œ ì‚¬ìš©í•œë‹¤.
	
	@constructor
	@ignore
	@see nv.$Ajax
 */
var klass = nv.$Class;
nv.$Ajax.RequestBase = klass({
	_respHeaderString : "",
	callbackid:"",
	callbackname:"",
	responseXML  : null,
	responseJSON : null,
	responseText : "",
	status : 404,
	readyState : 0,
	$init  : function(fpOption){},
	onload : function(){},
	abort  : function(){},
	open   : function(){},
	send   : function(){},
	setRequestHeader  : function(sName, sValue) {
		g_checkVarType(arguments, {
			'4str' : [ 'sName:String+', 'sValue:String+' ]
		},"$Ajax.RequestBase#setRequestHeader");
		this._headers[sName] = sValue;
	},
	getResponseHeader : function(sName) {
		g_checkVarType(arguments, {
			'4str' : [ 'sName:String+']
		},"$Ajax.RequestBase#getResponseHeader");
		return this._respHeaders[sName] || "";
	},
	getAllResponseHeaders : function() {
		return this._respHeaderString;
	},
	_getCallbackInfo : function() {
		var id = "";
		if(this.option("callbackid")!="") {
			var idx = 0;
			do {
				id = "_" + this.option("callbackid") + "_"+idx;
				idx++;
			} while (window["__"+nv._p_.nvName+"_callback"][id]);	
		}else{
			do {
				id = "_" + Math.floor(Math.random() * 10000);
			} while (window["__"+nv._p_.nvName+"_callback"][id]);
		}
		
		if(this.option("callbackname") == ""){
			this.option("callbackname","_callback");
		}
		return {callbackname:this.option("callbackname"),id:id,name:"window.__"+nv._p_.nvName+"_callback."+id};
	}
});
//-!nv.$Ajax.RequestBase end!-//

//-!nv.$Ajax.JSONPRequest start(nv.$Class,nv.$Ajax,nv.$Agent.prototype.navigator,nv.$Ajax.RequestBase)!-//
/**
	Ajax ìš”ì²­ íƒ€ìž…ì´ jsonpì¸ ìš”ì²­ ê°ì²´ë¥¼ ìƒì„±í•˜ë©°, nv.$Ajax() ê°ì²´ì—ì„œ Ajax ìš”ì²­ ê°ì²´ë¥¼ ìƒì„±í•  ë•Œ ì‚¬ìš©í•œë‹¤.
	
	@class nv.$Ajax.JSONPRequest
	@extends nv.$Ajax.RequestBase
	@ignore
 */
/**
	nv.$Ajax.JSONPRequest() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤. ì´ë•Œ, nv.$Ajax.JSONPRequest() ê°ì²´ëŠ” nv.$Ajax.RequestBase() ê°ì²´ë¥¼ ìƒì†í•œë‹¤.
	
	@constructor
	@ignore
	@see nv.$Ajax
	@see nv.$Ajax.RequestBase
 */
nv.$Ajax.JSONPRequest = klass({
	_headers : {},
	_respHeaders : {},
	_script : null,
	_onerror : null,
	$init  : function(fpOption){
		this.option = fpOption;
	},
	/**
	 * @ignore 
	 */
	_callback : function(data) {
		
		if (this._onerror) {
			clearTimeout(this._onerror);
			this._onerror = null;
		}
			
		var self = this;

		this.responseJSON = data;
		this.onload(this);
		setTimeout(function(){ self.abort(); }, 10);
	},
	abort : function() {
		if (this._script) {
			try { 
				this._script.parentNode.removeChild(this._script); 
			}catch(e){}
		}
	},
	open  : function(method, url) {
		g_checkVarType(arguments, {
			'4str' : [ 'method:String+','url:String+']
		},"$Ajax.JSONPRequest#open");
		this.responseJSON = null;
		this._url = url;
	},
	send  : function(data) {
		var oArgs = g_checkVarType(arguments, {
			'4voi' : [],
			'4nul' : ["data:Null"],
			'4str' : ["data:String+"]
		},"$Ajax.JSONPRequest#send");
		var t    = this;
		var info = this._getCallbackInfo();
		var head = document.getElementsByTagName("head")[0];
		this._script = document.createElement("script");
		this._script.type    = "text/javascript";
		this._script.charset = this.option("jsonp_charset");

		if (head) {
			head.appendChild(this._script);
		} else if (document.body) {
			document.body.appendChild(this._script);
		}
		window["__"+nv._p_.nvName+"_callback"][info.id] = function(data){
			try {
				t.readyState = 4;
				t.status = 200;
				t._callback(data);
			} finally {
				delete window["__"+nv._p_.nvName+"_callback"][info.id];
				delete window["__"+nv._p_.nvName+"2_callback"][info.id];
			}
		};
		window["__"+nv._p_.nvName+"2_callback"][info.id] = function(data){
		    window["__"+nv._p_.nvName+"_callback"][info.id](data);
		};
		
		var agent = nv.$Agent(navigator); 
		var _loadCallback = function(){
			if (!t.responseJSON) {
				t.readyState = 4;

				// when has no response code
				t.status = 500;
				t._onerror = setTimeout(function(){t._callback(null);}, 200);
			}
		};

        // On IE11 'script.onreadystatechange' and 'script.readyState' was removed and should be replaced to 'script.onload'.
        // http://msdn.microsoft.com/en-us/library/ie/bg182625%28v=vs.85%29.aspx
		if (agent.navigator().ie && this._script.readyState) {
			this._script.onreadystatechange = function(){		
				if (this.readyState == 'loaded'){
					_loadCallback();
					this.onreadystatechange = null;
				}
			};
		} else {
			this._script.onload = 
			this._script.onerror = function(){
				_loadCallback();
				this.onerror = null;
				this.onload = null;
			};
		}
		var delimiter = "&";
		if(this._url.indexOf('?')==-1){
			delimiter = "?";
		}
		switch(oArgs+""){
			case "4voi":
			case "4nul":
				data = "";
				break;
			case "4str":
				data = "&" + data;
				
			
		}
		//test url for spec.
		this._test_url = this._script.src = this._url+delimiter+info.callbackname+"="+info.name+data;
		
	}
}).extend(nv.$Ajax.RequestBase);
//-!nv.$Ajax.JSONPRequest end!-//

//-!nv.$Ajax.SWFRequest start(nv.$Class,nv.$Ajax,nv.$Agent.prototype.navigator,nv.$Ajax.RequestBase)!-//
/**
 	Ajax ìš”ì²­ íƒ€ìž…ì´ flashì¸ ìš”ì²­ ê°ì²´ë¥¼ ìƒì„±í•˜ë©°, nv.$Ajax() ê°ì²´ì—ì„œ Ajax ìš”ì²­ ê°ì²´ë¥¼ ìƒì„±í•  ë•Œ ì‚¬ìš©í•œë‹¤.
	
	@class nv.$Ajax.SWFRequest
	@extends nv.$Ajax.RequestBase
	@filter desktop
 */
/**
 	nv.$Ajax.SWFRequest() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤. ì´ë•Œ, nv.$Ajax.SWFRequest() ê°ì²´ëŠ” nv.$Ajax.RequestBase() ê°ì²´ë¥¼ ìƒì†í•œë‹¤.
	
	@constructor
	@filter desktop
	@see nv.$Ajax
	@see nv.$Ajax.RequestBase
 */
nv.$Ajax.SWFRequest = klass({
	$init  : function(fpOption){
		this.option = fpOption;
	},
	_headers : {},
	_respHeaders : {},
	_getFlashObj : function(){
		var _tmpId = nv.$Ajax.SWFRequest._tmpId;
		var navi = nv.$Agent(window.navigator).navigator();
		var obj;
		if (navi.ie&&navi.version==9) {
			obj = _getElementById(document,_tmpId);
		}else{
			obj = window.document[_tmpId];
		}
		return(this._getFlashObj = function(){
			return obj;
		})();
		
	},
	_callback : function(status, data, headers){
		this.readyState = 4;
        /*
          í•˜ìœ„ í˜¸í™˜ì„ ìœ„í•´ statusê°€ boolean ê°’ì¸ ê²½ìš°ë„ ì²˜ë¦¬
         */

		if( nv.$Jindo.isNumeric(status)){
			this.status = status;
		}else{
			if(status==true) this.status=200;
		}		
		if (this.status==200) {
			if (nv.$Jindo.isString(data)) {
				try {
					this.responseText = this.option("decode")?decodeURIComponent(data):data;
					if(!this.responseText || this.responseText=="") {
						this.responseText = data;
					}	
				} catch(e) {
                    /*
                         ë°ì´í„° ì•ˆì— utf-8ì´ ì•„ë‹Œ ë‹¤ë¥¸ ì¸ì½”ë”©ì¼ë•Œ ë””ì½”ë”©ì„ ì•ˆí•˜ê³  ë°”ë¡œ textì— ì €ìž¥.
                     */

					if(e.name == "URIError"){
						this.responseText = data;
						if(!this.responseText || this.responseText=="") {
							this.responseText = data;
						}
					}
				}
			}
            /*
             ì½œë°±ì½”ë“œëŠ” ë„£ì—ˆì§€ë§Œ, ì•„ì§ SWFì—ì„œ ì‘ë‹µí—¤ë” ì§€ì› ì•ˆí•¨
             */
			if(nv.$Jindo.isHash(headers)){
				this._respHeaders = headers;				
			}
		}
		
		this.onload(this);
	},
	open : function(method, url) {
		g_checkVarType(arguments, {
			'4str' : [ 'method:String+','url:String+']
		},"$Ajax.SWFRequest#open");
		var re  = /https?:\/\/([a-z0-9_\-\.]+)/i;

		this._url    = url;
		this._method = method;
	},
	send : function(data) {
		var cache = nv.$Jindo;
		var oArgs = cache.checkVarType(arguments, {
			'4voi' : [],
			'4nul' : ["data:Null"],
			'4str' : ["data:String+"]
		},"$Ajax.SWFRequest#send");
		this.responseXML  = false;
		this.responseText = "";

		var t = this;
		var dat = {};
		var info = this._getCallbackInfo();
		var swf = this._getFlashObj();

		function f(arg) {
			switch(typeof arg){
				case "string":
					return '"'+arg.replace(/\"/g, '\\"')+'"';
					
				case "number":
					return arg;
					
				case "object":
					var ret = "", arr = [];
					if (cache.isArray(arg)) {
						for(var i=0; i < arg.length; i++) {
							arr[i] = f(arg[i]);
						}
						ret = "["+arr.join(",")+"]";
					} else {
						for(var x in arg) {
							if(arg.hasOwnProperty(x)){
								arr[arr.length] = f(x)+":"+f(arg[x]);	
							}
						}
						ret = "{"+arr.join(",")+"}";
					}
					return ret;
				default:
					return '""';
			}
		}
		data = data?data.split("&"):[];

		var oEach, pos, key, val;
		for(var i=0; i < data.length; i++) {
			oEach = data[i]; 
			pos = oEach.indexOf("=");
			key = oEach.substring(0,pos);
			val = oEach.substring(pos+1);

			dat[key] = decodeURIComponent(val);
		}
		this._current_callback_id = info.id;
		window["__"+nv._p_.nvName+"_callback"][info.id] = function(success, data){
			try {
				t._callback(success, data);
			} finally {
				delete window["__"+nv._p_.nvName+"_callback"][info.id];
			}
		};
		
		window["__"+nv._p_.nvName+"2_callback"][info.id] = function(data){
            window["__"+nv._p_.nvName+"_callback"][info.id](data);
        };
		
		var oData = {
			url  : this._url,
			type : this._method,
			data : dat,
			charset  : "UTF-8",
			callback : info.name,
			header_json : this._headers
		};
		
		swf.requestViaFlash(f(oData));
	},
	abort : function(){
	    var info = this._getCallbackInfo();

		if(this._current_callback_id){
			window["__"+nv._p_.nvName+"_callback"][this._current_callback_id] = function() {
				delete window["__"+nv._p_.nvName+"_callback"][info.id];
				delete window["__"+nv._p_.nvName+"2_callback"][info.id];
			};

			window["__"+nv._p_.nvName+"2_callback"][this._current_callback_id] = function(data){
                window["__"+nv._p_.nvName+"_callback"][this._current_callback_id](data);
            };
		}
	}
}).extend(nv.$Ajax.RequestBase);

/**
	write() ë©”ì„œë“œëŠ” í”Œëž˜ì‹œ ê°ì²´ë¥¼ ì´ˆê¸°í™”í•˜ëŠ” ë©”ì„œë“œë¡œì„œ write() ë©”ì„œë“œë¥¼ í˜¸ì¶œí•˜ë©´ í†µì‹ ì„ ìœ„í•œ í”Œëž˜ì‹œ ê°ì²´ë¥¼ ë¬¸ì„œ ë‚´ì— ì¶”ê°€í•œë‹¤. Ajax ìš”ì²­ íƒ€ìž…ì´ flashì´ë©´ í”Œëž˜ì‹œ ê°ì²´ë¥¼ í†µí•´ í†µì‹ í•œë‹¤. ë”°ë¼ì„œ nv.$Ajax() ê°ì²´ì˜ request ë©”ì„œë“œê°€ í˜¸ì¶œë˜ê¸° ì „ì— write() ë©”ì„œë“œë¥¼ ë°˜ë“œì‹œ í•œ ë²ˆ ì‹¤í–‰í•´ì•¼ í•˜ë©°, <body> ìš”ì†Œì— ìž‘ì„±ë˜ì–´ì•¼ í•œë‹¤. ë‘ ë²ˆ ì´ìƒ ì‹¤í–‰í•´ë„ ë¬¸ì œê°€ ë°œìƒí•œë‹¤.
	
	@method write
	@param {String+} [sSWFPath="./ajax.swf"] Ajax í†µì‹ ì— ì‚¬ìš©í•  í”Œëž˜ì‹œ íŒŒì¼.
	@filter desktop
	@see nv.$Ajax#request
	@example
		<body>
		    <script type="text/javascript">
		        $Ajax.SWFRequest.write("/path/swf/ajax.swf");
		    </script>
		</body>
 */
nv.$Ajax.SWFRequest.write = function(swf_path) {
    var oArgs = nv.$Jindo.checkVarType(arguments, {
        '4voi' : [],
        '4str' : ["data:String+"]
    },"<static> $Ajax.SWFRequest#write");
    switch(oArgs+""){
        case "4voi":
            swf_path = "./ajax.swf";
        
    }
    var ajax = nv.$Ajax; 
    ajax.SWFRequest._tmpId = 'tmpSwf'+(new Date()).getMilliseconds()+Math.floor(Math.random()*100000);
    var activeCallback = "nv.$Ajax.SWFRequest.loaded";
    var protocol = (location.protocol == "https:")?"https:":"http:";
    var classid = (nv._p_._JINDO_IS_IE?'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"':'');
    ajax._checkFlashLoad();
    
    var body = document.body;
    var nodes = body.childNodes;
    var swf = nv.$("<div style='position:absolute;top:-1000px;left:-1000px' tabindex='-1'>/<div>");
    swf.innerHTML = '<object tabindex="-1" id="'+ajax.SWFRequest._tmpId+'" width="1" height="1" '+classid+' codebase="'+protocol+'//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"><param name="movie" value="'+swf_path+'"><param name = "FlashVars" value = "activeCallback='+activeCallback+'" /><param name = "allowScriptAccess" value = "always" /><embed tabindex="-1" name="'+ajax.SWFRequest._tmpId+'" src="'+swf_path+'" type="application/x-shockwave-flash" pluginspage="'+protocol+'://www.macromedia.com/go/getflashplayer" width="1" height="1" allowScriptAccess="always" swLiveConnect="true" FlashVars="activeCallback='+activeCallback+'"></embed></object>'; 

    if (nodes.length > 0) {
        body.insertBefore(swf, nodes[0]);
    } else {
        body.appendChild(swf);
    }    
};

/**
 * @ignore
 */
nv.$Ajax._checkFlashLoad = function(){
	nv.$Ajax._checkFlashKey = setTimeout(function(){
		nv.$Ajax.SWFRequest.onerror();
	},5000);
	nv.$Ajax._checkFlashLoad = function(){};
};
/**
	í”Œëž˜ì‹œ ê°ì²´ ë¡œë”© ì—¬ë¶€ë¥¼ ì €ìž¥í•œ ë³€ìˆ˜. ë¡œë”©ëœ ê²½ìš° trueë¥¼ ë°˜í™˜í•˜ê³  ë¡œë”©ë˜ì§€ ì•Šì€ ê²½ìš° falseë¥¼ ë°˜í™˜í•œë‹¤. í”Œëž˜ì‹œ ê°ì²´ê°€ ë¡œë”©ë˜ì—ˆëŠ”ì§€ í™•ì¸í•  ë•Œ ì‚¬ìš©í•  ìˆ˜ ìžˆë‹¤.	
	
	@method activeFlash
	@filter desktop
	@see nv.$Ajax.SWFRequest#write
 */
nv.$Ajax.SWFRequest.activeFlash = false;

/**
 * 	flashê°€ ì •ìƒì ìœ¼ë¡œ load ì™„ë£Œëœ í›„ ì‹¤í–‰ë˜ëŠ” í•¨ìˆ˜.
	
	@method onload
	@filter desktop
	@since 2.0.0
	@see nv.$Ajax.SWFRequest#onerror
	@example
		var oSWFAjax = $Ajax("http://naver.com/api/test.json",{
			"type" : "flash"
		});
	    $Ajax.SWFRequest.onload = function(){
			oSWFAjax.request();	
		}
 */
nv.$Ajax.SWFRequest.onload = function(){
};

/**
 * 	flashê°€ ì •ìƒì ìœ¼ë¡œ load ì™„ë£Œë˜ì§€ ì•Šì„ë•Œ ì‹¤í–‰ë˜ëŠ” í•¨ìˆ˜.
	
	@method onerror
	@filter desktop
	@see nv.$Ajax.SWFRequest#onerror
	@since 2.0.0
	@example
		var oSWFAjax = $Ajax("http://naver.com/api/test.json",{
			"type" : "flash"
		});
        $Ajax.SWFRequest.onerror = function(){
			alert("flashë¡œë“œ ì‹¤íŒ¨.ë‹¤ì‹œ ë¡œë“œí•˜ì„¸ìš”!");
		}
 */
nv.$Ajax.SWFRequest.onerror = function(){
};

/**
	flashì—ì„œ ë¡œë”© í›„ ì‹¤í–‰ ì‹œí‚¤ëŠ” í•¨ìˆ˜.
	
	@method loaded
	@filter desktop
	@ignore
 */
nv.$Ajax.SWFRequest.loaded = function(){
	clearTimeout(nv.$Ajax._checkFlashKey);
	nv.$Ajax.SWFRequest.activeFlash = true;
	nv.$Ajax.SWFRequest.onload();
};
//-!nv.$Ajax.SWFRequest end!-//

//-!nv.$Ajax.FrameRequest start(nv.$Class,nv.$Ajax,nv.$Ajax.RequestBase)!-//
/**
	nv.$Ajax.FrameRequest() ê°ì²´ëŠ” Ajax ìš”ì²­ íƒ€ìž…ì´ iframeì¸ ìš”ì²­ ï¿½ï¿½ï¿½ì²´ë¥¼ ìƒì„±í•˜ë©°, nv.$Ajax() ê°ì²´ì—ì„œ Ajax ìš”ì²­ ê°ì²´ë¥¼ ìƒì„±í•  ë•Œ ì‚¬ìš©í•œë‹¤.
	
	@class nv.$Ajax.FrameRequest
	@extends nv.$Ajax.RequestBase
	@filter desktop
	@ignore
 */
/**
	nv.$Ajax.FrameRequest() ê°ì²´ë¥¼ ìƒì„±í•œë‹¤. ì´ë•Œ, nv.$Ajax.FrameRequest() ê°ì²´ëŠ” nv.$Ajax.RequestBase() ê°ì²´ë¥¼ ìƒì†í•œë‹¤.
	
	@constructor
	@filter desktop
	@ignore
	@see nv.$Ajax
	@see nv.$Ajax.RequestBase
 */
nv.$Ajax.FrameRequest = klass({
	_headers : {},
	_respHeaders : {},
	_frame  : null,
	_domain : "",
	$init  : function(fpOption){
		this.option = fpOption;
	},
	_callback : function(id, data, header) {
		var self = this;

		this.readyState   = 4;
		this.status = 200;
		this.responseText = data;

		this._respHeaderString = header;
		header.replace(/^([\w\-]+)\s*:\s*(.+)$/m, function($0,$1,$2) {
			self._respHeaders[$1] = $2;
		});

		this.onload(this);

		setTimeout(function(){ self.abort(); }, 10);
	},
	abort : function() {
		if (this._frame) {
			try {
				this._frame.parentNode.removeChild(this._frame);
			} catch(e) {}
		}
	},
	open : function(method, url) {
		g_checkVarType(arguments, {
			'4str' : [ 'method:String+','url:String+']
		},"$Ajax.FrameRequest#open");
		
		var re  = /https?:\/\/([a-z0-9_\-\.]+)/i;
		var dom = document.location.toString().match(re);
		
		this._method = method;
		this._url    = url;
		this._remote = String(url).match(/(https?:\/\/[a-z0-9_\-\.]+)(:[0-9]+)?/i)[0];
		this._frame = null;
		this._domain = (dom != null && dom[1] != document.domain)?document.domain:"";
	},
	send : function(data) {
		var oArgs = g_checkVarType(arguments, {
			'4voi' : [],
			'4nul' : ["data:Null"],
			'4str' : ["data:String+"]
		},"$Ajax.FrameRequest#send");
		
		this.responseXML  = "";
		this.responseText = "";

		var t      = this;
		var re     = /https?:\/\/([a-z0-9_\-\.]+)/i;
		var info   = this._getCallbackInfo();
		var url;
		var _aStr = [];
		_aStr.push(this._remote+"/ajax_remote_callback.html?method="+this._method);
		var header = [];

		window["__"+nv._p_.nvName+"_callback"][info.id] = function(id, data, header){
			try {
				t._callback(id, data, header);
			} finally {
				delete window["__"+nv._p_.nvName+"_callback"][info.id];
				delete window["__"+nv._p_.nvName+"2_callback"][info.id];
			}
		};
		
		window["__"+nv._p_.nvName+"2_callback"][info.id] = function(id, data, header){
            window["__"+nv._p_.nvName+"_callback"][info.id](id, data, header);
        };

		for(var x in this._headers) {
			if(this._headers.hasOwnProperty(x)){
				header[header.length] = "'"+x+"':'"+this._headers[x]+"'";	
			}
			
		}

		header = "{"+header.join(",")+"}";
		
		_aStr.push("&id="+info.id);
		_aStr.push("&header="+encodeURIComponent(header));
		_aStr.push("&proxy="+encodeURIComponent(this.option("proxy")));
		_aStr.push("&domain="+this._domain);
		_aStr.push("&url="+encodeURIComponent(this._url.replace(re, "")));
		_aStr.push("#"+encodeURIComponent(data));

		var fr = this._frame = document.createElement("iframe");
		var style = fr.style;
		style.position = "absolute";
		style.visibility = "hidden";
		style.width = "1px";
		style.height = "1px";

		var body = document.body || document.documentElement;
		if (body.firstChild){ 
			body.insertBefore(fr, body.firstChild);
		}else{ 
			body.appendChild(fr);
		}
		if(typeof MSApp != "undefined"){
			MSApp.addPublicLocalApplicationUri(this.option("proxy"));
		}
		
		fr.src = _aStr.join("");
	}
}).extend(nv.$Ajax.RequestBase);
//-!nv.$Ajax.FrameRequest end!-//

//-!nv.$Ajax.Queue start(nv.$Ajax)!-//
/**
	nv.$Ajax.Queue() ê°ì²´ëŠ” Ajax ìš”ì²­ì„ íì— ë‹´ì•„ íì— ë“¤ì–´ì˜¨ ìˆœì„œëŒ€ë¡œ ìš”ì²­ì„ ì²˜ë¦¬í•œë‹¤.
	
	@class nv.$Ajax.Queue
	@keyword ajaxqueue, queue, ajax, í
 */
/**
	nv.$Ajax() ê°ì²´ë¥¼ ìˆœì„œëŒ€ë¡œ í˜¸ì¶œí•  ìˆ˜ ìžˆë„ë¡ ê¸°ëŠ¥ì„ ì œê³µí•œë‹¤.
	
	@constructor
	@param {Hash+} oOption nv.$Ajax.Queue() ê°ì²´ê°€ ì„œë²„ë¡œ í†µì‹ ì„ ìš”ì²­í•  ë•Œ ì‚¬ìš©í•˜ëŠ” ì •ë³´ë¥¼ ì •ì˜í•œë‹¤.
		@param {Boolean} [oOption.async=false] ë¹„ë™ê¸°/ë™ê¸° ìš”ì²­ ë°©ì‹ì„ ì„¤ì •í•œë‹¤. ë¹„ë™ê¸° ìš”ì²­ ë°©ì‹ì´ë©´ true, ë™ê¸° ìš”ì²­ ë°©ì‹ì´ë©´ falseë¥¼ ì„¤ì •í•œë‹¤.
		@param {Boolean} [oOption.useResultAsParam=false] ì´ì „ ìš”ì²­ ê²°ê³¼ë¥¼ ë‹¤ìŒ ìš”ì²­ì˜ íŒŒë¼ë¯¸í„°ë¡œ ì „ë‹¬í• ì§€ ê²°ì •í•œë‹¤. ì´ì „ ìš”ì²­ ê²°ê³¼ë¥¼ íŒŒë¼ë¯¸í„°ë¡œ ì „ë‹¬í•˜ë ¤ë©´ true, ê·¸ë ‡ê²Œ í•˜ì§€ ì•Šì„ ê²½ìš° falseë¥¼ ì„¤ì •í•œë‹¤.
		@param {Boolean} [oOption.stopOnFailure=false] ì´ì „ ìš”ì²­ì´ ì‹¤íŒ¨í•  ê²½ìš° ë‹¤ìŒ ìš”ì²­ ì¤‘ë‹¨ ì—¬ë¶€ë¥¼ ì„¤ì •í•œë‹¤. ë‹¤ìŒ ìš”ì²­ì„ ì¤‘ë‹¨í•˜ë ¤ë©´ true, ê³„ì† ì‹¤í–‰í•˜ë ¤ë©´ falseë¥¼ ì„¤ì •í•œë‹¤.
	@since 1.3.7
	@see nv.$Ajax
	@example
		// $Ajax ìš”ì²­ íë¥¼ ìƒì„±í•œë‹¤.
		var oAjaxQueue = new $Ajax.Queue({
			useResultAsParam : true
		});
 */
nv.$Ajax.Queue = function (option) {
	//-@@$Ajax.Queue-@@//
	var cl = arguments.callee;
	if (!(this instanceof cl)){ return new cl(option||{});}
	
	var oArgs = g_checkVarType(arguments, {
		'4voi' : [],
		'4obj' : ["option:Hash+"]
	},"$Ajax.Queue");
	option = oArgs.option;
	this._options = {
		async : false,
		useResultAsParam : false,
		stopOnFailure : false
	};

	this.option(option);
	
	this._queue = [];	
};

/**
	option() ë©”ì„œë“œëŠ” nv.$Ajax.Queue() ê°ì²´ì— ì„¤ì •í•œ ì˜µì…˜ ê°’ì„ ë°˜í™˜í•œë‹¤.
	
	@method option
	@param {String+} vName ì˜µì…˜ì˜ ì´ë¦„
	@return {Variant} ìž…ë ¥í•œ ì˜µì…˜ì„ ë°˜í™˜í•œë‹¤.
	@see nv.$Ajax.Queue
	@example
		oAjaxQueue.option("useResultAsParam");	// useResultAsParam ì˜µì…˜ ê°’ì¸ true ë¥¼ ë¦¬í„´í•œë‹¤.
 */
/**
	option() ë©”ì„œë“œëŠ” nv.$Ajax.Queue() ê°ì²´ì— ì§€ì •í•œ ì˜µì…˜ ê°’ì„ í‚¤ì™€ ê°’ìœ¼ë¡œ ì„¤ì •í•œë‹¤.
	
	@method option
	@syntax sName, vValue
	@syntax oOption
	@param {String+} sName ì˜µì…˜ì˜ ì´ë¦„(String)
	@param {Variant} [vValue] ì„¤ì •í•  ì˜µì…˜ì˜ ê°’. ì„¤ì •í•  ì˜µì…˜ì„ vNameì— ì§€ì •í•œ ê²½ìš°ì—ë§Œ ìž…ë ¥í•œë‹¤.
	@param {Hash+} oOption ì˜µì…˜ì˜ ì´ë¦„(String) ë˜ëŠ” í•˜ë‚˜ ì´ìƒì˜ ì˜µì…˜ì„ ì„¤ì •í•œ ê°ì²´(Object).
	@return {this} ì§€ì •í•œ ì˜µì…˜ì„ ì„¤ì •í•œ ì¸ìŠ¤í„´ìŠ¤ ìžì‹ 
	@see nv.$Ajax.Queue
	@example
		var oAjaxQueue = new $Ajax.Queue({
			useResultAsParam : true
		});
		
		oAjaxQueue.option("async", true);		// async ì˜µì…˜ì„ true ë¡œ ì„¤ì •í•œë‹¤.
 */
nv.$Ajax.Queue.prototype.option = function(name, value) {
	var oArgs = g_checkVarType(arguments, {
		's4str' : [ 'sKey:String+', 'sValue:Variant' ],
		's4obj' : [ 'oOption:Hash+' ],
		'g' : [ 'sKey:String+' ]
	},"$Ajax.Queue#option");
	
	switch(oArgs+"") {
		case 's4str':
			this._options[oArgs.sKey] = oArgs.sValue;
			break;
		case 's4obj':
			var oOption = oArgs.oOption;
			try {
				for (var x in oOption) {
					if (oOption.hasOwnProperty(x)) 
						this._options[x] = oOption[x];
				}
			}catch(e) {}
			break;
		case 'g':
			return this._options[oArgs.sKey];
	}

	return this;
};

/**
	add() ë©”ì„œë“œëŠ” $Ajax.Queueì— Ajax ìš”ì²­(nv.$Ajax() ê°ì²´)ì„ ì¶”ê°€í•œë‹¤.
	
	@method add
	@syntax oAjax, oParam
	@param {nv.$Ajax} oAjax ì¶”ê°€í•  nv.$Ajax() ê°ì²´.
	@param {Hash+} [oParam] Ajax ìš”ì²­ ì‹œ ì „ì†¡í•  íŒŒë¼ë¯¸í„° ê°ì²´.
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹  
	@example
		var oAjax1 = new $Ajax('ajax_test.php',{
			onload :  function(res){
				// onload í•¸ë“¤ëŸ¬
			}
		});
		var oAjax2 = new $Ajax('ajax_test.php',{
			onload :  function(res){
				// onload í•¸ë“¤ëŸ¬
			}
		});
		var oAjax3 = new $Ajax('ajax_test.php',{
			onload :  function(res){
				// onload í•¸ë“¤ëŸ¬
			}
		
		});
		
		var oAjaxQueue = new $Ajax.Queue({
			async : true,
			useResultAsParam : true,
			stopOnFailure : false
		});
		
		// Ajax ìš”ì²­ì„ íì— ì¶”ê°€í•œë‹¤.
		oAjaxQueue.add(oAjax1);
		
		// Ajax ìš”ì²­ì„ íì— ì¶”ê°€í•œë‹¤.
		oAjaxQueue.add(oAjax1,{seq:1});
		oAjaxQueue.add(oAjax2,{seq:2,foo:99});
		oAjaxQueue.add(oAjax3,{seq:3});
		
		oAjaxQueue.request();
 */
nv.$Ajax.Queue.prototype.add = function (oAjax, oParam) {
	var oArgs = g_checkVarType(arguments, {
		'4obj' : ['oAjax:Hash+'],
		'4obj2' : ['oAjax:Hash+','oPram:Hash+']
	},"$Ajax.Queue");
	switch(oArgs+""){
		case "4obj2":
			oParam = oArgs.oPram;
	}
	
	this._queue.push({obj:oAjax, param:oParam});
	return this;
};

/**
	request() ë©”ì„œë“œëŠ” $Ajax.Queueì— ìžˆëŠ” Ajax ìš”ì²­ì„ ì„œë²„ë¡œ ë³´ë‚¸ë‹¤.
	
	@method request
	@return {this} ì¸ìŠ¤í„´ìŠ¤ ìžì‹  
	@example
		var oAjaxQueue = new $Ajax.Queue({
			useResultAsParam : true
		});
		oAjaxQueue.add(oAjax1,{seq:1});
		oAjaxQueue.add(oAjax2,{seq:2,foo:99});
		oAjaxQueue.add(oAjax3,{seq:3});
		
		// ì„œë²„ì— Ajax ìš”ì²­ì„ ë³´ë‚¸ë‹¤.
		oAjaxQueue.request();
 */
nv.$Ajax.Queue.prototype.request = function () {
	this._requestAsync.apply(this,this.option('async')?[]:[0]);
	return this;
};

nv.$Ajax.Queue.prototype._requestSync = function (nIdx, oParam) {
	var t = this;
	var queue = this._queue;
	if (queue.length > nIdx+1) {
		queue[nIdx].obj._oncompleted = function(bSuccess, oResult){
			if(!t.option('stopOnFailure') || bSuccess) t._requestSync(nIdx + 1, oResult);
		};
	}
	var _oParam = queue[nIdx].param||{};
	if(this.option('useResultAsParam') && oParam){
		try { for(var x in oParam) if(_oParam[x] === undefined && oParam.hasOwnProperty(x)) _oParam[x] = oParam[x]; } catch(e) {}
	}
	queue[nIdx].obj.request(_oParam);
};

nv.$Ajax.Queue.prototype._requestAsync = function () {
	for( var i=0; i<this._queue.length; i++)
		this._queue[i].obj.request(this._queue[i].param||{});
};
//-!nv.$Ajax.Queue end!-//


!function() {
    // Add nv._p_.addExtension method to each class.
    var aClass = [ "$Agent","$Ajax","$A","$Cookie","$Date","$Document","$Element","$ElementList","$Event","$Form","$Fn","$H","$Json","$S","$Template","$Window" ],
        sClass, oClass;

    for(var i=0, l=aClass.length; i<l; i++) {
        sClass = aClass[i];
        oClass = nv[sClass];

        if(oClass) {
            oClass.addExtension = (function(sClass) {
                return function(sMethod,fpFunc){
                    nv._p_.addExtension(sClass,sMethod,fpFunc);
                    return this;
                };
            })(sClass);
        }
    }

    // Add hook method to $Element and $Event
    var hooks = ["$Element","$Event"];

    for(var i=0, l=hooks.length; i<l; i++) {
        var _className = hooks[i];
        if(nv[_className]) {
            nv[_className].hook = (function(className) {
                var __hook = {};
                return function(sName, vRevisionKey) {

                    var oArgs = nv.$Jindo.checkVarType(arguments, {
                        'g'  : ["sName:String+"],
                        's4var' : ["sName:String+", "vRevisionKey:Variant"],
                        's4obj' : ["oObj:Hash+"]
                    },"nv."+className+".hook");

                    switch(oArgs+"") {
                        case "g":
                            return __hook[oArgs.sName.toLowerCase()];
                        case "s4var":
                            if(vRevisionKey == null){
                                delete __hook[oArgs.sName.toLowerCase()];
                            } else {
                                __hook[oArgs.sName.toLowerCase()] = vRevisionKey;
                            }

                            return this;
                        case "s4obj":
                            var oObj = oArgs.oObj;
                            for(var i in oObj) {
                                __hook[i.toLowerCase()] = oObj[i];
                            }

                            return this;
                    }
                };
            })(_className);
        }
    }

    //-!nv.$Element.unload.hidden start!-//
    if(!nv.$Jindo.isUndefined(window)&& !(nv._p_._j_ag.indexOf("IEMobile") == -1 && nv._p_._j_ag.indexOf("Mobile") > -1 && nv._p_._JINDO_IS_SP)) {
        (new nv.$Element(window)).attach("unload",function(e) {
            nv.$Element.eventManager.cleanUpAll();
        });
    }
    //-!nv.$Element.unload.hidden end!-//

    // Register as a named AMD module
    if(typeof define === "function" && define.amd) {
        define("nv", [], function() { return nv; });
    }
}();;/**
 * @constructor
 * @description NAVER Login authorize API
 * @author juhee.lee@nhn.com
 * @version 0.0.1
 * @date 14. 11. 21
 * @copyright 2014 Licensed under the MIT license.
 * @param {PropertiesHash} htOption
 * @param {string} htOption.client_id ì–´í”Œë¦¬ì¼€ì´ì…˜ ë“±ë¡ ì‹œ ë¶€ì—¬ ë°›ì€ id
 * @param {string} htOption.client_secret ì–´í”Œë¦¬ì¼€ì´ì…˜ ë“±ë¡ ì‹œ ë¶€ì—¬ ë°›ì€ secret
 * @param {string} htOption.redirect_uri ì–´í´ë¦¬ì¼€ì´ì…˜ ë“±ë¡ ì‹œ ìž…ë ¥í•œ redirect uri
 * @returns {{api: Function, checkAuthorizeState: Function, getAccessToken: Function, updateAccessToken: Function, logout: Function, login: Function}}
 * @example
 * var naver = NaverAuthorize({
 *   client_id : "ì–´í”Œë¦¬ì¼€ì´ì…˜ id",
 *   client_secret : "ì–´í”Œë¦¬ì¼€ì´ì…˜ secret",
 *   redirect_uri : "redirect uri"
 * });
 */
NaverAuthorize = function(htOption) {
    var SERVICE_PROVIDER = "NAVER",
        URL = {
            LOGIN : "https://nid.naver.com/oauth2.0/authorize",
            AUTHORIZE : "https://nid.naver.com/oauth2.0/token",
            API : "https://apis.naver.com/nidlogin/nid/getUserProfile.json?response_type=json"
        },
        GRANT_TYPE = {
            "AUTHORIZE" : "authorization_code",
            "REFRESH" : "refresh_token",
            "DELETE" : "delete"
        };

    var client_id = htOption.client_id,
        client_secret = htOption.client_secret,
        redirect_uri = htOption.redirect_uri,
        code, state_token;


    /**
     * ajax í†µì‹  ê°ì²´ ë¦¬í„´
     * @ignore
     * @param {string} sUrl í˜¸ì¶œí•  ì„œë²„ì˜ URL
     * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
     * @returns {*}
     * @private
     */
    _ajax = function(sUrl, callback) {
        return nv.$Ajax(sUrl, {
            type : 'jsonp',
            method : 'get',
            callbackname: 'oauth_callback',
            timeout : 3,
            onload : function(data) {
                callback(data);
            },
            ontimeout : function() {
                callback({"error":"timeout"});
            },
            onerror : function() {
                callback({"error" : "fail"});
            }
        });
    };

    /**
     * queryStringìœ¼ë¡œ ì „ë‹¬ ë°›ì€ íŒŒë¼ë¯¸í„°ì˜ ê°’ ì¶”ì¶œ
     * @ignore
     * @param {string} name queryStringì˜ key ì´ë¦„
     * @returns {*}
     * @private
     */
    _getUrlParameter = function(name) {
        var page_url = window.location.search.substring(1),
            key, values  = page_url.split("&"),
            count = values.length, i;

        for(i=0; i<count; i++) {
            key = values[i].split("=");
            if(key[0] == name) {
                return key[1];
            }
        }

        return null;
    };

    /**
     * ë¡œê·¸ì¸ ì¸ì¦ ì½”ë“œê°€ ìžˆëŠ”ì§€ í™•ì¸
     * @ignore
     * @returns {boolean}
     * @private
     */
    _hasAuthorizeCode = function() {
        code = _getUrlParameter("code");
        return (code !== null);
    };

    /**
     * state token ì´ ë§žëŠ”ì§€ í™•ì¸
     * @ignore
     * @param {string} token state í† í°
     * @returns {boolean}
     * @private
     */
    _isStateToken = function(token) {
        state_token = _getUrlParameter("state");
        return (state_token !== null && state_token === token);
    };

    /**
     * ì‚¬ìš©ìž ì •ë³´ë¥¼ ìš”ì²­
     * @ignore
     * @param {string} access_token access í† í°
     * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
     * @private
     */
    _getUserInfo = function(access_token, callBack) {
        _ajax(URL.API, callBack).request({
            "Authorization": encodeURIComponent("Bearer " + access_token)
        });
    };

    /**
     * Access Token ìƒì„±
     * @ignore
     * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
     * @private
     */
    _createAccessToken = function(callBack) {
        _ajax(URL.AUTHORIZE, callBack).request({
            "grant_type" : GRANT_TYPE.AUTHORIZE,
            "client_id" : client_id,
            "client_secret" : client_secret,
            "code" : code,
            "state" : state_token
        });
    };

    /**
     * Access Token ê°±ì‹ 
     * @ignore
     * @param {string} refresh_token refresh í† í°
     * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
     * @private
     */
    _updateAccessToken = function(refresh_token, callBack) {
        _ajax(URL.AUTHORIZE, callBack).request({
            "grant_type" : GRANT_TYPE.REFRESH,
            "client_id" : client_id,
            "client_secret" : client_secret,
            "refresh_token" : refresh_token
        });
    };

    /**
     * Access Token ì‚­ì œ
     * @ignore
     * @param {string} access_token access í† í°
     * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
     * @private
     */
    _removeAccessToken = function(access_token, callBack) {
        _ajax(URL.AUTHORIZE, callBack).request({
            "grant_type" : GRANT_TYPE.DELETE,
            "client_id" : client_id,
            "client_secret" : client_secret,
            "access_token" : encodeURIComponent(access_token),
            "service_provider" : SERVICE_PROVIDER
        });
    };


    return {
        /**
         * API í˜¸ì¶œ í•¨ìˆ˜
         * @param {string} method í˜¸ì¶œí•  API ëª…ë ¹ì–´ (/me : ì‚¬ìš©ìž ì •ë³´ë¥¼ ìš”ì²­)
         * @param {string} access_token access í† í°
         * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
         */
        api : function(method, access_token, callBack) {
            if(method === "/me") {
                _getUserInfo(access_token, callBack);
            } else {
				_ajax(method, callBack).request({
            		"Authorization": "Bearer " + access_token
        		});	
			}
        },

        /**
         * ë¡œê·¸ì¸ ì¸ì¦ ìƒíƒœë¥¼ í™•ì¸
         * @param {string} state_token state í† í°
         * @returns {string} ì—ëŸ¬ ë©”ì‹œì§€
         */
        checkAuthorizeState : function(state_token) {
            var error = _getUrlParameter("error");

            if(error !== null) {
                return error;
            }

            if(_hasAuthorizeCode() && _isStateToken(state_token)) {
                return "connected";
            }

            return "not_available_state";
        },

        /**
         * Access Token ì„ ëŒë ¤ì¤Œ
         * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
         */
        getAccessToken : function(callBack) {
            _createAccessToken(callBack);
        },

        /**
         * Access Token ì„ ì—…ë°ì´íŠ¸í•˜ì—¬ ëŒë ¤ì¤Œ
         * @param {string} refresh_token refresh í† í°
         * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
         */
        updateAccessToken : function(refresh_token, callBack) {
            _updateAccessToken(refresh_token, callBack);
        },

        /**
         * ë¡œê·¸ì•„ì›ƒ
         * @param {string} access_token access í† í°
         * @param {requestCallback} callback ì‘ë‹µì´ ì˜¬ ë•Œ í˜¸ì¶œ ë  ì½œë°±
         */
        logout : function(access_token, callBack) {
            _removeAccessToken(access_token, callBack)
        },

        /**
         * ë¡œê·¸ì¸
         * @param {string} state_token state í† í°
         */
        login : function(state_token) {
            document.location.href = URL.LOGIN + "?client_id=" + client_id + "&response_type=code&redirect_uri=" + encodeURIComponent(redirect_uri) + "&state=" + state_token;
        }
    };

}