// Library for access to the system and device features.
//

if(typeof _reviver_ != "undefined") {
 if(_reviver_.revive()) location.reload();
}

//
// These are some definitions for older versions of Android
//
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.lastIndexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}
if(!document.dispatchCustomEvent) {
  document.dispatchCustomEvent = function(event) {
    function visit(elem,event) {
      elem.dispatchEvent(event);
      var child = elem.firstChild;
      while(child) {
        if(child.nodeType==1) visit(child,event);
        child = child.nextSibling;
      }
    }
    document.dispatchEvent(event);
    visit(document.documentElement,event);
  }
}

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

(function () {
  if ( typeof window.CustomEvent === "function" ) return false;
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
})();

var eventCounter = 0;

function makeEventName(prefix) {
  return prefix + "" + (eventCounter++);
}

//
// android object incorporates all other objects and functions defined in this file.
//
var android = (function(global) {
  var ifs = {
    files : global._JSFiles_,
    webView : global._JSWebView_,
    activity : global._JSActivity_,
    alarm : global._JSAlarm_,
    billing : global._JSBilling_,
    bitmaps : global._JSBitmaps_,
    bitmaps4 : global._JSBitmaps4_,
    clipboard : global._JSClipboard_,
    control: global._JSControl_,
    dialog: global._JSDialog_,
    thisDialog: global._ThisDialog_,
    download : global._JSDownload_,
    location : global._JSLocation_,
    log : global._JSLog_,
    network : global._JSNetwork_,
    notification : global._JSNotification_,
    sensors : global._JSSensors_,
    toast : global._JSToast_,
    reflect : global._JSReflect_,
    viewPager : global._JSViewPager_,
    fileProvider : global._JSFileProvider_,
    webViewClient: global._WebViewClient_,
    webChromeClient: global._WebChromeClient_,
  };

  var packageName = null;
  if(ifs.webView) packageName = ifs.webView.getPackageName();
  else
  if(ifs.activity) packageName = ifs.activity.getPackageName();
  else
  if(ifs.reflect) packageName = ifs.reflect.getPackageName();

  function reportMissingApi(name) {
    alert("The "+name+" API is not included. Set the field WebView | includeApi | "+name+" = true");
  }

  function checkForApi(ifName,apiName) {
    if(!apiName) apiName = ifName;
    if(ifs[ifName]) return;
    reportMissingApi(apiName);
    throw new Error("Missing API: "+apiName);
  }

  function newInstance(name,args) {
    if(!args) args = [];
    var params = [];
    for(var i=0; i<args.length; ++i) {
      var value = args[i];
      if(value instanceof JavaObject) value = {id:value._getId()};
      else value = {value:value};
      params[i] = value;
    }
    var result = JSON.parse(ifs.reflect.newInstance(name,JSON.stringify(params)));
    if(result.error) { throw new Error(result.error); }
    else
      if(typeof result.id === 'undefined') return result.value;
      else return new JavaObject(result.id);
  }

  function invokeMethod(obj,name,args) {
    if(!args) args = [];
    //console.log("InvokeMethod: "+name+" on "+obj._getId()+", args="+JSON.stringify(args));
    var params = [];
    for(var i=0; i<args.length; ++i) {
      var value = args[i];
      if(value instanceof JavaObject) value = {id:value._getId()};
      else
      if(typeof value === "undefined") value = {value:null};
      else
      if(typeof value === "object" && value.type) {
        if(value.value instanceof JavaObject) value = {id:value._getId(),type:value.type};
        else
        if(typeof value.value === "undefined") value = {value:null,type:value.type};
      }
      else value = {value:value};
      params[i] = value;
    }
    var result;
    result = JSON.parse(ifs.reflect.invoke(obj._getId(),name,JSON.stringify(params)));
    if(result.error) {  throw new Error("Error invoking "+name+": "+result.error); }
    else
    if(typeof result.id === 'undefined') return result.value;
    else return new JavaObject(result.id);
  }

  function getJavaField(obj,name) {
    var result = JSON.parse(ifs.reflect.getField(obj._getId(),name));
    if(typeof result.id === 'undefined') return result.value;
    else return new JavaObject(result.id);
  }

  function setJavaField(obj,name,value) {
    if(value instanceof JavaObject) value = JSON.stringify({id:value._getId()});
    else value = JSON.stringify({value:value});
    ifs.reflect.setField(obj._getId(),name,value);
  }

  function JavaObject(id) {
    checkForApi("reflect");

    const self = this;
    this._getId = function() { return id; };

    this._keep = function(value) { ifs.reflect.keep(id,value===false?false:true);}
    this._forget = function() { ifs.reflect.forget(id);}
    try {
      this["class"] = ifs.reflect.getClassName(id);
    }
    catch(err) {
      this["class"] = null;
    }
    if(this["class"]==="java.lang.Class") {
      this._newInstance = function(args) {
        return newInstance(id,args);
      }
    }

    return new Proxy(this,{
      get(obj, prop) {
        if(typeof prop === "string") {
          if(prop in obj) return obj[prop];
          if(prop.startsWith("get_")) {
            return function(name) { return getJavaField(obj,name.substring(4)); }
          }
          if(prop.startsWith("set_")) {
            return function(name,value) { setJavaField(obj,name.substring(4),value); }
          }
          if(ifs.reflect.isMethod(obj._getId(),prop)) {
            return function(...args) {
              return invokeMethod(obj,prop,args);
            }
          }
          if(ifs.reflect.isField(obj._getId(),prop)) {
             return getJavaField(obj,prop);
          }
          return undefined;
        }
        else {
          return obj[prop];
        }
      },
      set(obj, prop, value) {
        setJavaField(obj,prop,value);
      }
    });
  }

  var java = {};
  if(typeof _JSReflect_ !== 'undefined') {
    java = {
      activity: new JavaObject("activity"),
      webView: new JavaObject("webView"),
      Class: new JavaObject("Class"),
      getClass: function(name) { return new JavaObject(name); },
      getField: function(obj,name) { return getJavaField(obj,name); },
      setField: function(obj,name,value) { setJavaField(obj,name,value); },
      invoke: function(obj,name,...args) { return invokeMethod(obj,name,args); },
      newInstance: function(name,...args) { return newInstance(name,args); },
      keep: function(obj,value) { if(obj && obj._keep) obj._keep(value===false?false:true); },
      forget: function(obj) { if(obj && obj._forget) obj._forget(); },
      forgetAll: function() { ifs.reflect.forgetAll(); }
    };
    java.class = java.Class; // legacy
    java.res = java.activity.getResources();
    java.R = {
        anim: new JavaObject(packageName + ".R$anim"),
        animator: new JavaObject(packageName + ".R$animator"),
        array: new JavaObject(packageName + ".R$array"),
        attr: new JavaObject(packageName + ".R$attr"),
        bool: new JavaObject(packageName + ".R$bool"),
        color: new JavaObject(packageName + ".R$color"),
        dimen: new JavaObject(packageName + ".R$dimen"),
        drawable: new JavaObject(packageName + ".R$drawable"),
        font: new JavaObject(packageName + ".R$font"),
        id: new JavaObject(packageName + ".R$id"),
        integer: new JavaObject(packageName + ".R$integer"),
        interpolator: new JavaObject(packageName + ".R$interpolator"),
        layout: new JavaObject(packageName + ".R$layout"),
        menu: new JavaObject(packageName + ".R$menu"),
        mipmap: new JavaObject(packageName + ".R$mipmap"),
        plurals: new JavaObject(packageName + ".R$plurals"),
        raw: new JavaObject(packageName + ".R$raw"),
        string: new JavaObject(packageName + ".R$string"),
        style: new JavaObject(packageName + ".R$style"),
        styleable: new JavaObject(packageName + ".R$styleable"),
        xml: new JavaObject(packageName + ".R$xml"),
    }

  }

  //
  // Legacy -- do not use
  //
  var Reflect = function Reflect() {
    this.activity = new JavaObject("activity");
    this.webView = new JavaObject("webView");
    this.Class = new JavaObject("Class");

    this.newInstance = function(name,args) { return newInstance(name,args); }

    this.keep = function(obj,value) {
      if(obj instanceof JavaObject) {
        ifs.reflect.keep(obj._getId(),value==true);
      }
    };
  };

  //
  // Legacy -- do not use
  //
  var reflect = {
    getClassDeclaredFields: function(className) {
      checkForApi("reflect");
      var result = JSON.parse(ifs.reflect.getClassDeclaredFields(className));
      if(result.error) throw new Error(result.error);
      else return result.list;
    },
  };

  var toPath = function(obj) {
    return obj?obj.toString():null;
  }

  var extendPath = function(a,b) {
    if(a=="/") return "/"+b;
    else return a+"/"+b;
  }

  var observerCount = 0;

  var File = function() {
    checkForApi("files");
    var path = (arguments.length==1?toPath(arguments[0]):extendPath(toPath(arguments[0]),toPath(arguments[1])));
    this.canRead = function() {
      return ifs.files.canRead(path);
    };
    this.canWrite = function() {
      return ifs.files.canWrite(path);
    };
    this.copyTo = function(file) {
      return ifs.files.copy(path,toPath(file));
    };
    this.copyFromUri = function(uri) {
      return ifs.files.copyUriToFile(uri,path);
    };
    this.append = function(data) {
      return ifs.files.append(path,data);
    };
    this.createNewFile = function() {
      try { return ifs.files.createNewFile(path); }
      catch(e) { throw new Error("Error when creating new file '"+path+"': "+ifs.files.getLastError()); }
    };
    this.delete = function() { return ifs.files.delete(path); };
    this.deleteFileOrFolder = function() {
      if(!this.exists()) return false;
      if(this.isDirectory()) {
        var list = this.listFiles();
        for(var i=0; i<list.length; ++i) {
          if(!list[i].deleteFileOrFolder()) return false;
        }
      }
      return this.delete();
    };

    this.equals = function(file) { return path==toPath(file); };
    this.exists = function() { return ifs.files.exists(path); };
    this.getName = function() {
      var idx = path.lastIndexOf("/");
      if(idx>=0) return path.substring(idx+1);
      else return path;
    };
    this.getContentUri = function() {
      return ifs.fileProvider.getContentUri(path);
    }
    this.getParent = function() {
      var idx = path.lastIndexOf("/");
      if(idx>0) return new File(path.substring(0,idx));
      else
      if(idx==0) return new File("/");
      else return null;
    };
    this.getPathRelativeTo = function(dir) {
       var p = toPath(dir);
       if(p==path) return "";
       if(p.length<path.length && path.startsWith(p+"/")) {
          return path.substring(p.length+1);
       }
       else throw new Error("Invalid dir parameter");
    }
    this.getSuffix = function() {
      var name = this.getName();
      var idx = name.lastIndexOf(".");
      if(idx>0) return name.substring(idx+1);
      else return null;
    };
    this.isDirectory = function() { return path==null?false:ifs.files.isDirectory(path); };
    this.isFile = function() { return path==null?false:ifs.files.isFile(path); };
    this.lastModified = function() { return ifs.files.lastModified(path); };
    this.length = function() { return ifs.files.length(path); };
    this.list = function() { return JSON.parse(ifs.files.list(path)); };
    this.listFiles = function() {
      var list = JSON.parse(ifs.files.list(path));
      for(var i=0; i<list.length; ++i) list[i] = new File(path,list[i]);
      return list;
    };
    this.mkdir = function() { return ifs.files.mkdir(path); };
    this.mkdirs = function() { return ifs.files.mkdirs(path); };
    this.read = function() { return ifs.files.read(path); };
    this.readBase64 = function() { return ifs.files.readBase64(path); };
    this.readHex = function(pos,len) { return ifs.files.readHex(path,pos,len); };
    this.renameTo = function(file) {
      if(file instanceof File) file = file.toString();
      return ifs.files.rename(path,file);
    };
    this.setLastModified = function(time) { ifs.files.setLastModified(time); };
    this.share = function(mimeType) {
      ifs.files.share(path,mimeType?mimeType:null);
    };
    this.startObserver = function(mask,handler) {
      handler.observerId = (++observerCount);
      var eventName = "FileObserver."+handler.observerId;
      document.addEventListener(eventName,handler);
      ifs.files.startObserver(path,mask,""+handler.observerId);
    };
    this.stopObserver = function(handler) {
      ifs.files.stopObserver(handler.observerId);
      var eventName = "FileObserver."+handler.observerId;
      document.removeEventListener(eventName,handler);
    };
    this.tail = function(size) {
      return ifs.files.tail(path,size);
    };
    this.toString  = function() { return path; };
    this.unzip = function(dir,callback) {
      var dirPath = toPath(dir);
      if(callback) {
        var event = "unzipFinished";
        var handler = function(e) {
          if(e.detail.folder==dirPath && e.detail.zip==path) {
            document.removeEventListener(event,handler);
            callback(e.detail);
          }
        }
        document.addEventListener(event,handler);
      }
      console.log("unzipping "+path+" to "+dirPath);
      ifs.files.unzip(path,dirPath);
    }

    this.unzipText = function(name) {
      return ifs.files.unzipText(path,name);
    }

    this.unzipOne = function(what,dest) {
      return new Promise(function(resolve,reject){
          var eventName = makeEventName("unzipOne.finished.");
          var handler = function(e) {
            document.removeEventListener(eventName,handler);
            var res = e.detail;
            if(res.ok) resolve(res);
            else reject(res);
          }
          document.addEventListener(eventName,handler);
          ifs.files.unzipOne(path,what,toPath(dest),eventName);
      });
    }
    this.visit = function(callback) {
      var list = this.listFiles();
      for(var i=0; i<list.length; ++i) {
        var file = list[i];
        if(callback(file)===false) return false;
        if(file.isDirectory()) {
          if(file.visit(callback)===false) return false;
        }
      }
      return true;
    };
    this.write = function(str) { return ifs.files.write(path,str); };
    this.writeBase64 = function(str) { return ifs.files.writeBase64(path,str); };
    this.zip = function(zip,callback) {
      var zipPath = toPath(zip);
      if(callback) {
        var event = "zipFinished";
        var handler = function(e) {
          if(e.detail.folder==path && e.detail.zip==zipPath) {
            document.removeEventListener(event,handler);
            callback(e.detail);
          }
        }
        document.addEventListener(event,handler);
      }
      ifs.files.zip(path,zipPath);
    }
  };

  var AssetFile = function() {
    checkForApi("files");
    var path = (arguments.length==1?toPath(arguments[0]):extendPath(toPath(arguments[0]),toPath(arguments[1])));
    this.copyTo = function(file) {
      return ifs.files.copyAssets(path,toPath(file));
    };
    this.equals = function(file) { return path==toPath(file); };
    this.getName = function() {
      var idx = path.lastIndexOf("/");
      if(idx>=0) return path.substring(idx+1);
      else return path;
    };
    this.getParent = function() {
      var idx = path.lastIndexOf("/");
      if(idx>0) return new AssetFile(path.substring(0,idx));
      else return null;
    };
    this.getSuffix = function() {
      var name = this.getName();
      var idx = name.lastIndexOf(".");
      if(idx>0) return name.substring(idx+1);
      else return null;
    };
    this.isFile = function() { return ifs.files.isAssetFile(path); };
    this.isDirectory = function() { return ifs.files.isAssetDir(path); };
    this.list = function() { return JSON.parse(ifs.files.listAssets(path)); };
    this.listFiles = function() {
      var list = JSON.parse(ifs.files.listAssets(path));
      for(var i=0; i<list.length; ++i) list[i] = new AssetFile(path,list[i]);
      return list;
    };
    this.read = function() {
      return ifs.files.readAsset(path);
    };
    this.toString  = function() { return path; }
  };

  var files = {
    cancelCopyInBackground : function() {
      ifs.files.cancelCopyInBackground();
    },
    copyInBackground : function(arr) {
      ifs.files.copyInBackground(JSON.stringify(arr));
    },
    createTempFile : function(prefix,suffix,dir) {
      return new File(ifs.files.createTempFile(prefix,suffix,toPath(dir)));
    },
    getBackgroundStatus : function() {
      return JSON.parse(ifs.files.getBackgroundStatus());
    },
    getFilesDir : function() {
      return new File(ifs.files.getFilesDir());
    },
    getExternalFilesDir : function() {
      var dir = ifs.files.getExternalFilesDir();
      if(dir==null) return null;
      else return new File(dir);
    },
    getPublicDir : function(type) {
      return new File(ifs.files.getPublicDir(type));
    },
    getRootDir : function() {
      return new File(ifs.files.getRootDir());
    },
    getExternalDir : function() {
      return new File(ifs.files.getExternalDir());
    },


    isGoodName : function(name) {
      if(!name||name.length==0) return false;
      if(ifs.webView.getUTF8Length(name)>255) return false;
      if(name.indexOf("/")>=0) return false;
      return  true;
    },

    extensionToMimeType: function(ext) {
      return ifs.files.extensionToMimeType(ext);
    },

    mimeTypeToExtension: function(mimeType) {
      return ifs.files.mimeTypeToExtension(mimeType);
    },

    toFile : function(obj) {
      if(obj instanceof android.File) return obj;
      else return new android.File(obj);
    },

  };

  var gravity = { LEFT:3, RIGHT:5, START:8388611, END:8388613};


  var requestCodeCounter = 1;

  var activity = {
    addEventInstruction: function(instr) {
      checkForApi("activity");
      ifs.activity.addEventInstruction(JSON.stringify(instr));
    },
    dispatchEvent: function(name,detail) {
      checkForApi("activity");
      if(!detail) detail = {};
      var json = JSON.stringify(detail);
      ifs.activity.fireEvent(name,json);
    },
    finish : function() {
      checkForApi("activity");
      ifs.activity.finish();
    },
    finishActivity : function(requestCode) {
      checkForApi("activity");
      ifs.activity.finishActivity(requestCode);
    },
    hideKeyboard : function() {
      checkForApi("activity");
      ifs.activity.hideKeyboard();
    },
    inflateView : function(layout,parent,id) {
      checkForApi("activity");
      ifs.activity.inflateView(layout,parent,id);
    },
    setBackAction : function(action) {
      checkForApi("activity");
      ifs.activity.setBackAction(action);
    },
    setTitle : function(title) {
      checkForApi("activity");
      ifs.activity.setTitle(title);
    },
    showView : function(name) {
      checkForApi("activity");
      ifs.activity.setVisibility(name,0);
    },
    hideView : function(name) {
      checkForApi("activity");
      ifs.activity.setVisibility(name,8);
    },
    startActivity : function(intent,showChooser) {
      checkForApi("activity");
      ifs.activity.startActivity(JSON.stringify(intent),showChooser?true:false);
    },
    startOwnActivity : function(name,extra) {
      checkForApi("activity");
      ifs.activity.startOwnActivity(name,extra?JSON.stringify(extra):null);
    },
    startActivityForResult : function(intent,callback,showChooser) {
      checkForApi("activity");
      var rc = requestCodeCounter++;
      var eventHandler = function(e) {
        if(e.detail.requestCode==rc) {
          document.removeEventListener("activityResult",eventHandler);
          if(callback) callback(e.detail);
        }
      }
      document.addEventListener("activityResult",eventHandler);
      ifs.activity.startActivityForResult(JSON.stringify(intent),rc,showChooser?true:false);
      return rc;
    },
    updateMenu : function(menu) {
      checkForApi("activity");
      ifs.activity.updateMenu(JSON.stringify(menu));
    },
    loadUrl : function(name,url) {
      checkForApi("activity");
      ifs.activity.loadUrl(name,url);
    },
    closeDrawer : function(gravity) {
      checkForApi("activity");
      ifs.activity.closeDrawer(gravity);
    },
    openDrawer : function(gravity) {
      checkForApi("activity");
      ifs.activity.openDrawer(gravity);
    },
    isDrawerOpen : function(gravity) {
      checkForApi("activity");
      return ifs.activity.isDrawerOpen(gravity);
    },
    getIntent: function() {
      checkForApi("activity");
      return JSON.parse(ifs.activity.getIntent());
    },
    getIntentAction : function() {
      checkForApi("activity");
      return ifs.activity.getIntentAction();
    },
    getIntentData : function() {
      checkForApi("activity");
      return ifs.activity.getIntentData();
    },
    getIntentExtra : function(name) {
      checkForApi("activity");
      if(!name) {
        try {
          var json = ifs.activity.getIntentExtra(null);
          return JSON.parse(json);
        }
        catch(e) { console.log("error: "+e); return {}; }
      }
      else return ifs.activity.getIntentExtra(name);
    },
    getOwnClassName: function() {
      checkForApi("activity");
      return ifs.activity.getOwnClassName();
    },
    getPackageName: function() {
      checkForApi("activity");
      return ifs.activity.getPackageName();
    },
    listRingtones: function() {
      checkForApi("activity");
      return JSON.parse(ifs.activity.listRingtones());
    },
    sendBroadcast: function(intent) {
      checkForApi("activity");
      var err = ifs.activity.sendBroadcast(JSON.stringify(intent));
      if(err) throw new Error(err);
    },
    shareFile: function(file,mimeType,callback) {
      checkForApi("activity");
      checkForApi("files");
      var contentUri = android.files.toFile(file).getContentUri();
      var intent = {
        action: "android.intent.action.SEND",
        type: mimeType,
        extras: {"android.intent.extra.STREAM":contentUri},
        extras_types: {"android.intent.extra.STREAM":"Uri"}
      };
      this.startActivity(intent,callback,true);
    },
    setRefreshing: function(name,value) {
       var id = android.resources.getIdForName("refresh");
       if(id) {
         var act = new android.JavaObject("activity");
         var view = act.findViewById(id);
         if(view) { view.setRefreshing(false);  return true; }
       }
       return false;
    },
    setVisibility: function(name,value) {
      checkForApi("activity");
      ifs.activity.setVisibility(name,value);
    }

  };

  var bitmaps = {
    decodeBounds: function(file) {
      checkForApi("bitmaps");
      return JSON.parse(ifs.bitmaps.decodeBounds(file.toString()));
    },
    makeRoundedBitmap: function(spec) {
      checkForApi("bitmaps");
      var result = JSON.parse(ifs.bitmaps4.makeRoundedBitmap(JSON.stringify(spec)));
      if(result.error) throw new Error(result.error);
    },
    toThumbnail : function(src,dst,iconSize) {
      checkForApi("bitmaps");
      return ifs.bitmaps.toThumbnail(toPath(src),toPath(dst),iconSize);
    },
    resize: function(src,dst,sample,maxWidth,maxHeight,quality) {
      checkForApi("bitmaps");
      return ifs.bitmaps.resize(toPath(src),toPath(dst),sample,maxWidth,maxHeight,quality);
    }
  };

  var dialog = {
    create: function(name,data,show) {
      checkForApi("dialog","dialogs");
      return ifs.dialog.create(name,JSON.stringify(data),show);
    },
    createNew: function(name,data,show) {
      checkForApi("dialog","dialogs");
      ifs.dialog.createNew(name,JSON.stringify(data),show);
    },
    show: function(name) {
      checkForApi("dialog","dialogs");
      return ifs.dialog.show(name);
    },
    dismiss: function(name) {
      checkForApi("dialog","dialogs");
      return ifs.dialog.dismiss(name);
    },
    fireEvent: function(name,data) {
      checkForApi("dialog","dialogs");
      return ifs.dialog.fireEvent(name,JSON.stringify(data));
    },
    onDismiss: function(name,callback) {
      checkForApi("dialog","dialogs");
      var handler = function(e){
        if(e.detail.name==name) {
          document.removeEventListener("DialogDismissed",handler);
          callback(e.detail);
        }
      }
      document.addEventListener("DialogDismissed",handler);
    }
  }

  function checkDialog() { if(!ifs.thisDialog) throw new Error("not in a dialog"); }

  var thisDialog = {
    dismiss: function() {
      checkDialog();
      ifs.thisDialog.dismiss();
    },
    putObject: function(name,obj) {
      checkDialog();
      ifs.thisDialog.putObject(name,JSON.stringify(obj));
    },
    putArray: function(name,obj) {
      checkDialog();
      ifs.thisDialog.putArray(name,JSON.stringify(obj));
    },
    putString: function(name,obj) {
      checkDialog();
      ifs.thisDialog.putString(name,obj);
    },
    putInt: function(name,obj) {
      checkDialog();
      ifs.thisDialog.putInt(name,obj);
    },
    putFloat: function(name,obj) {
      checkDialog();
      ifs.thisDialog.putFloat(name,obj);
    },
    putBoolean: function(name,obj) {
      checkDialog();
      ifs.thisDialog.putBoolean(name,obj);
    },
    getObject: function(name) {
      checkDialog();
      return JSON.parse(ifs.thisDialog.getObject(name));
    },
    getArray: function(name) {
      checkDialog();
      return JSON.parse(ifs.thisDialog.getArray(name));
    },
    getString: function(name) {
      checkDialog();
      return ifs.thisDialog.getString(name);
    },
    getBoolean: function(name) {
      checkDialog();
      return ifs.thisDialog.getBoolean(name);
    },
    getInt: function(name) {
      checkDialog();
      return ifs.thisDialog.getInt(name);
    },
    getFloat: function(name) {
      checkDialog();
      return ifs.thisDialog.getDouble(name);
    },
  }

  var toast = {
    show : function(msg) {
      checkForApi("toast");
      ifs.toast.show(msg);
    },
    showLong : function(msg) {
      checkForApi("toast");
      ifs.toast.showLong(msg);
    }
  };

  var webView = {
    addInterfaces : function(interfaces,callback) {
      console.log("android.webView.addInterfaces() has been removed for security reasons.\nUse the App Logic to add interfaces.");
    },
    clearCache : function() {
      checkForApi("webView");
      ifs.webView.clearCache();
    },
    clearHistory : function() {
      checkForApi("webView");
      ifs.webView.clearHistory();
    },
    enableZoom : function(enable) {
      checkForApi("webView");
      ifs.webView.enableZoom(enable);
    },
    getArgument : function() {
      checkForApi("webView");
      return ifs.webView.getArgument();
    },
    getErrorCode : function() { // legacy, use webViewClient instead
      if(typeof ifs.webViewClient != "undefined") return ifs.webViewClient.getErrorCode();
      else return ifs.webView.getErrorCode();
    },
    getErrorMessage : function() { // legacy, use webViewClient instead
      if(typeof ifs.webViewClient != "undefined") return ifs.webViewClient.getErrorMessage();
      else return ifs.webView.getErrorMessage();
    },
    getFailingUrl : function() { // legacy, use webViewClient instead
      if(typeof ifs.webViewClient != "undefined") return ifs.webViewClient.getFailingUrl();
      else return ifs.webView.getFailingUrl();
    },
    getMapValue: function(key) {
      checkForApi("webView");
       return ifs.webView.getMapValue(key);
    },
    setMapValue: function(key,value) {
      checkForApi("webView");
       ifs.webView.setMapValue(key,value);
    },
    resetError : function() { // legacy, use webViewClient instead
      if(typeof ifs.webViewClient != "undefined") ifs.webViewClient.resetError();
      else ifs.webView.resetError();
    },
    print : function() {
      checkForApi("webView");
      ifs.webView.print();
    },
    getId : function() {
      checkForApi("webView");
      return ifs.webView.getId();
    },
    isInActionMode: function() {
      console.log("android.webView.isInActionMode is no longer available.");
      return false;
    },
    registerForBroadcast: function(action) {
      checkForApi("webView");
      ifs.webView.registerForBroadcast(action);
    },
    unregisterForBroadcast: function(action) {
      checkForApi("webView");
      ifs.webView.unregisterForBroadcast(action);
    },
    setAllowExternalURLs : function(allow) { // legacy, use webViewClient
      if(typeof ifs.webViewClient != "undefined") ifs.webViewClient.setAllowExternalURLs(allow);
      else {
        checkForApi("webView");
        ifs.webView.setAllowExternalURLs(allow);
      }
    },
    setAlertTitle : function(title) {
      if(typeof ifs.webChromeClient != "undefined") ifs.webChromeClient.setAlertTitle(title);
      else ifs.webView.setAlertTitle(title);
    },
    setAlertTheme : function(name) {
      var obj = typeof ifs.webChromeClient != "undefined"?ifs.webChromeClient:ifs.webView;
      if(!obj.setAlertTheme(name)) throw new Error("Theme not found: "+name);
    },
    setArgument : function(arg) {
      checkForApi("webView");
      ifs.webView.setArgument(arg);
    },
    setBackButtonLogic : function(logic) {
      checkForApi("webView");
      if(!logic || logic=="none" || logic=="useHistory" || logic=="useHistoryOrDefault" || logic=="fireEvent") {
        ifs.webView.setBackButtonLogic(logic);
      }
      else console.log("Wrong argument for setBackButtonLogic: '"+logic+"'");
    },
    setCacheMode : function(value) { // legacy, do not use
      checkForApi("webView");
      ifs.webView.setCacheMode(value);
    },
    setConsoleId : function(id) { // legacy, does nothing
      checkForApi("webView");
      ifs.webView.setConsoleId(id);
    },
    setActionModeType : function(type) {
      checkForApi("webView");
      ifs.webView.setActionModeType(type);
    },
    startActionMode : function(name,options) {
      checkForApi("webView");
      ifs.webView.startActionMode(name,options?JSON.stringify(options):null);
    },
    setOutput: function(console,log) {
      console.log("android.webView.setOutput is no longer supported");
    },
    setNoInputConnection: function(value) {
      console.log("android.webView.setNoInputConnection is no longer supported");
    },
    setImeInfo: function(value) {
      console.log("android.webView.setImeInfo is no longer supported");
    },
    version: function() {
      checkForApi("webView");
      return ifs.webView.version();
    }
  };

  var webChromeClient = {
    setAlertTitle : function(title) {
      checkForApi("webChromeClient");
      ifs.webChromeClient.setAlertTitle(title);
    },
    setAlertTheme : function(name) {
      checkForApi("webChromeClient");
      ifs.webChromeClient.setAlertTheme(name);
    },
  };

  var webViewClient = {
    getErrorCode : function() {
      checkForApi("webViewClient");
      return ifs.webViewClient.getErrorCode();
    },
    getErrorMessage : function() {
      checkForApi("webViewClient");
      return ifs.webViewClient.getErrorMessage();
    },
    getFailingUrl : function() {
      checkForApi("webViewClient");
      return ifs.webViewClient.getFailingUrl();
    },
    resetError : function() {
      checkForApi("webViewClient");
      ifs.webViewClient.resetError();
    },
    setAllowExternalURLs : function(allow) {
      checkForApi("webViewClient");
      ifs.webViewClient.setAllowExternalURLs(allow);
    },
  };

  var location = {
    provider : {gps:"gps",network:"network"},
    getLastKnownLocation : function(provider) {
      checkForApi("location");
      var result = ifs.location.getLastKnownLocation(provider);
      if(result==null) return null;
      else return JSON.parse(result);
    },
    requestLocationUpdates : function(provider,minTime,minDistance) {
      checkForApi("location");
      var result = ifs.location.requestLocationUpdates(provider,minTime,minDistance);
      if(result==null) return null;
      else return JSON.parse(result);
    },
    stopLocationUpdates : function() {
      checkForApi("location");
      ifs.location.stopLocationUpdates();
    },
    isProviderEnabled : function(provider) {
      checkForApi("location");
      return ifs.location.isProviderEnabled(provider);
    },
    getProviders : function(enabledOnly) {
      checkForApi("location");
      if(typeof enabledOnly ==='undefined'
      || (enabledOnly!==true && enabledOnly!==false)) enabledOnly = false;
      return JSON.parse(ifs.location.getProviders(enabledOnly));
    }
  };

  var clipboard = {
    hasText : function() {
      checkForApi("clipboard");
      return ifs.clipboard.hasText();
    },
    getText : function() {
      checkForApi("clipboard");
      return ifs.clipboard.getText();
    },
    setText : function(text) {
      checkForApi("clipboard");
      ifs.clipboard.setText(text);
    }
  };

  var content = {
    getUriInfo : function(uri) {
      checkForApi("activity");
      var info = ifs.activity.getUriInfo(uri);
      if(info) return JSON.parse(info);
      else return {};
    },
  };

  var download = {
    start : function(info) {
      checkForApi("download");
      if(!info) throw new Error("No info provided for download.start()");
      if(!info.url) throw new Error("No 'url' provided for download.start()");
      if(!info.path) throw new Error("No 'path' provided for download.start()");
      var json = JSON.stringify(info);
      var id = ifs.download.startDownload(json);
      if(id==0) throw new Error(ifs.download.lastError());
      return id;
    },
    checkDownloadStatus: function(id) {
      checkForApi("download");
      var json = ifs.download.checkDownloadStatus(id);
      if(json==null) throw new Error("Cannot check download status: "+ifs.download.lastError());
      return JSON.parse(json);
    },
    remove: function(id) {
      checkForApi("download");
      ifs.download.remove(id);
    },
    status : { success:8,running:2,pending:1,paused:4,failed:16},
    reason : {waiting_to_retry:1,waiting_for_network:2,waiting_for_wifi:3,unknown:4,},
    visibility : {hidden:2,visible:0,visible_notify_completed:1}
  };

  var log = {
    read : function(thisProcessOnly) {
      checkForApi("log");
      return ifs.log.read(thisProcessOnly);
    }
  };

  var vibrator = {
    vibrate : function(msec) {
      navigator.vibrate(msec);
    },
    cancel : function() {
      navigator.vibrate(0);
    }
  };

  var resources = {
    getIdForName : function(name) {
      checkForApi("activity");
      return ifs.activity.getIdForName(name);
    },
    listByType: function(type) {
      checkForApi("activity");
      var result = ifs.activity.listResourcesByType(type);
      if(!result) throw new Error("Invalid resource type: "+type);
      return JSON.parse(result);
    }
  };

  var sensors = {
    typeAmbientTemperature : 13,
    typeGameRotationVector : 15,
    typeGeomagneticRotationVector  : 20,
    typeGravity : 9,
    typeGyroscope : 4,
    typeGyroscopeUncalibrated : 16,
    typeHeartRate : 21,
    typeLight : 5,
    typeLinearAcceleration : 10,
    typeMagneticField : 2,
    typeMagneticFieldUncalibrated : 14,
    typePressure : 6,
    typeProximity : 8,
    typeRelativeHumidity : 12,
    typeRotationVector : 11,
    typeSignificantMotion : 17,
    typeStepCounter : 19,
    typeStepDetector : 18,
    typeTemperature : 7,

    enableSensor : function(type) {
      checkForApi("sensors");
      return ifs.sensors.enableSensor(type);
    },
    disableSensor : function(type) {
      checkForApi("sensors");
      ifs.sensors.disableSensor(type);
    }
  };

  var system = {
    getApiLevel: function() {
      var version = new JavaObject("android.os.Build$VERSION");
      return version.SDK_INT;
    },
    getAppVersionCode: function() {
      var act = new JavaObject("activity");
      var pInfo = act.getPackageManager().getPackageInfo(act.getPackageName(), 0);
      return pInfo.versionCode;
    },
    checkRuntimePermission: function(name) {
      var ver = android.system.getApiLevel();
      if(ver<23) {
        return true;
      }
      var cc = new JavaObject("androidx.core.content.ContextCompat");
      var act = new JavaObject("activity");
      return cc.checkSelfPermission(act,name)==0;
    },
    requestPermissions: function(name) {
      var ver = android.system.getApiLevel();
      if(ver<23) return;
      var ac = new JavaObject("androidx.core.app.ActivityCompat");
      var act = new JavaObject("activity");
      var names;
      if(Array.isArray(name)) names = name;
      else names = [name];
      var rc = requestCodeCounter++;
      ac.requestPermissions(act,names,rc);
    }

  };

  var viewPager = {

    getCurrentItem: function(id,callback) {
      checkForApi("viewPager");
      var event = "ViewPager.CurrentItem";
      var handler = function(e) {
        if(e.detail.id==id) {
          document.removeEventListener(event,handler);
          callback(e.detail.position);
        }
      };
      document.addEventListener(event,handler);
      ifs.viewPager.getCurrentItem(id);
    },

    OnPageSelected: function(id,callback) {
      var event = "ViewPager.OnPageSelected";
      var handler = function(e) {
        if(e.detail.id==id) {
          callback(e.detail.position);
        }
      };
      document.addEventListener(event,handler);
    },

    setCurrentItem: function(id,position) {
      checkForApi("viewPager");
      ifs.viewPager.setCurrentItem(id,position);
    },

    setData: function(id,data) {
      checkForApi("viewPager");
      ifs.viewPager.setData(id,JSON.stringify(data));
    },

    setOffscreenPageLimit: function(id,limit) {
      checkForApi("viewPager");
      ifs.viewPager.setOffscreenPageLimit(id,limit);
    },

    setPageIcon: function(id,position,icon) {
      checkForApi("viewPager");
      ifs.viewPager.setPageIcon(id,position,icon);
    },

    setPageTitle: function(id,position,title) {
      checkForApi("viewPager");
      ifs.viewPager.setPageTitle(id,position,title);
    },
  };


  var network = {
    uploadFile: function(file,url,parms) {
      checkForApi("network");
      ifs.network.uploadFile(file.toString(),url,JSON.stringify(parms));
    },
  };

  var notification = {
    cancel: function(id) {
      checkForApi("notification");
      ifs.notification.cancel(id);
    },
    cancelAll: function() {
      checkForApi("notification");
      ifs.notification.cancelAll();
    },
    show: function(id,data) {
      checkForApi("notification");
      ifs.notification.show(id,JSON.stringify(data));
    },
  };

  var firebase = {
    getCurrentUser: function() {
       throw "android.firebase is no longer supported";
    },

    getDownloadUrl: function(storagePath,params) {
       throw "android.firebase is no longer supported";
    },

    getFile: function(filePath,storagePath,params) {
       throw "android.firebase is no longer supported";
    },

    getFileData: function(storagePath,params) {
       throw "android.firebase is no longer supported";
    },

    once: function(path,filter) {
       throw "android.firebase is no longer supported";
    },

    listenTo: function(path,filter,event) {
       throw "android.firebase is no longer supported";
    },

    logEvent: function(name,data) {
       throw "android.firebase is no longer supported";
    },

    makeKey: function(path) {
       throw "android.firebase is no longer supported";
    },

    putFile: function(filePath,storagePath,params) {
       throw "android.firebase is no longer supported";
    },

    putFileData: function(storagePath,params) {
       throw "android.firebase is no longer supported";
    },

    removeValue: function(path) {
       throw "android.firebase is no longer supported";
    },

    setValue: function(path,value) {
       throw "android.firebase is no longer supported";
    },

    setUserId: function(id) {
       throw "android.firebase is no longer supported";
    },

    setUserProperty: function(name,value) {
       throw "android.firebase is no longer supported";
    },

    signInWithGoogle: function(params) {
       throw "android.firebase is no longer supported";
    },

    signOut: function() {
       throw "android.firebase is no longer supported";
    },

    subscribe: function(topic) {
       throw "android.firebase is no longer supported";
    },

    unsubscribe: function(topic) {
       throw "android.firebase is no longer supported";
    },
  };

  var google = {
    getLastSignIn: function() {
       throw "android.google is no longer supported";
    },

    signIn: function(params) {
       throw "android.google is no longer supported";
    },

    signOut: function() {
       throw "android.google is no longer supported";
    },
  };

  var alarm = {
    cancel: function(params) {
      checkForApi("notification");
      var res = ifs.alarm.cancel(JSON.stringify(params));
      if(res.error) throw new Error(res.error);
    },
    set: function(params) {
      checkForApi("notification");
      var res = ifs.alarm.set(JSON.stringify(params));
      if(res.error) throw new Error(res.error);
    },
  };

  var control = {
    execute: function(code) {
      checkForApi("control");
      ifs.control.execute(code);
    },
    dispatchEvent: function(name,params) {
      checkForApi("control");
      if(!params) params = [];
      var json = JSON.stringify(params);
      ifs.control.dispatchEvent(name,json);
    },
    feedback: function(data) {
      checkForApi("control");
      if(!data) data = {};
      var json = JSON.stringify(data);
      ifs.control.feedback(json);
    }
  };

  return {
    alarm: alarm,
    AssetFile : AssetFile,
    File : File,
    java: java,
    JavaObject : JavaObject, // legacy, use android.java instead
    Reflect : Reflect, // legacy, use android.java instead
    activity : activity,
    bitmaps : bitmaps,
    clipboard : clipboard,
    content : content,
    control : control,
    dialog: dialog,
    download : download,
    files : files,
    firebase: firebase,
    google: google,
    gravity : gravity,
    location : location,
    log : log,
    network: network,
    notification: notification,
    observerMask : {
       ACCESS : 1,
       ALL_EVENTS : 4095,
       ATTRIB : 4,
       CLOSE_NOWRITE : 16,
       CLOSE_WRITE : 8,
       CREATE : 256,
       DELETE : 512,
       DELETE_SELF : 1024,
       MODIFY : 2,
       MOVED_FROM : 64,
       MOVED_TO : 128,
       MOVE_SELF : 2048,
       OPEN : 32,
    },
    packageName: packageName,
    reflect: reflect, // legacy, use android.java instead
    resources : resources,
    sensors : sensors,
    system: system,
    thisDialog: thisDialog,
    toast : toast,
    vibrator : vibrator, // legacy, use navigator.vibrate(time)
    viewPager: viewPager,
    webView : webView,
    webChromeClient: webChromeClient,
    webViewClient: webViewClient
  };
})(window);