/// <reference path="app.js" />

/**
 * کنترلر پپ آپ
 */
var popupCtrl = {
    activationStatus: function (port, msg) {
        clog('activation status: ', msg);
        port.postMessage({
            action: 'callback.activationStatus',
            result: true
        });
    },
    loginStatus: function (port, msg) {
        clog('login status: ', msg);
        port.postMessage({
            action: 'callback.loginStatus',
            result: true
        });
    },

    getViewer: function(port,msg){
        clog('get viewer');
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                clog('viewer found');
                port.postMessage({
                    action: 'callback.getViewer',
                    result: true,
                    viewer: tabs[items[0].id].getViewer()
                });
            } else {
                clog('viewer not found');
                port.postMessage({
                    action: 'callback.getViewer',
                    result: false
                });
            }
        });
    },

    /**
     * ایجاد وظیفه
     */
    createTask: function (port, msg) {
        clog('create task request:', msg);
        //تولید وظیفه
        var result = taskService.create(msg);
        //بازگردانی نتیجه
        port.postMessage({
            action: 'callback.createTask',
            result: result
        });
    },
    getCurrentPage: function (port, msg) {
        clog('get current page request:', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                tabs[items[0].id].postMessage({
                    action: 'getCurrentPage'
                }, function (msg) {
                    clog('get current page response :', msg);
                    port.postMessage({
                        action: 'callback.getCurrentPage',
                        result: msg.result,
                        username: msg.username
                    });
                });
            } else {
                port.postMessage({
                    action: 'callback.getCurrentPage',
                    result: false
                });
            }
        });
    },
    getCurrentTask: function (port, msg) {
        //clog('get current task', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id].task != undefined) {
                    //clog('task found');
                    port.postMessage({
                        action: 'callback.getCurrentTask',
                        result: true,
                        task: tabs[items[0].id].task.getStatus()
                    });
                } else {
                    clog('task not found');
                    port.postMessage({
                        action: 'callback.getCurrentTask',
                        result: false
                    });
                }
            } else {
                clog('tab not found');
                port.postMessage({
                    action: 'callback.getCurrentTask',
                    result: false
                });
            }
        });

    },
    stopTask: function (port, msg) {
        clog('stop task', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id].task != undefined) {
                    clog('stop task:task found');
                    taskService.stop(tabs[items[0].id].task);
                    port.postMessage({
                        action: 'callback.stopTask',
                        result: true
                    });
                } else {
                    clog('stop task:task not found');
                    port.postMessage({
                        action: 'callback.stopTask',
                        result: false
                    });
                }
            } else {
                clog('stop task:tab not found');
                port.postMessage({
                    action: 'callback.stopTask',
                    result: false
                });
            }
        });
    },
    /**
     * تعداد فالوینگ ها
     */
    getFollowingsCount: function (port, msg) {
        clog('get followings count', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id] !== undefined) {
                    var viewer = tabs[items[0].id].getViewer();
                    clog('get viewer response: ', viewer);
                    if (viewer != null) {
                        var db = getDb(viewer.id);
                        db.followHistories.where('status').equals(followStatus.following).count(function (count) {
                            port.postMessage({
                                action: 'callback.getFollowingsCount',
                                result: true,
                                count: count
                            });
                        }).catch(function (err) {
                            clog('db count of followings error:' + err);
                            port.postMessage({
                                action: 'callback.getFollowingsCount',
                                result: false
                            });
                        });
                    } else {
                        clog('user not logged in');
                        port.postMessage({
                            action: 'callback.getFollowingsCount',
                            result: false
                        });
                    }

                } else {
                    clog('get followings count:tab is undefined');
                    port.postMessage({
                        action: 'callback.getFollowingsCount',
                        result: false
                    });
                }

            } else {
                clog('get followings count:tab not found');
                port.postMessage({
                    action: 'callback.getFollowingsCount',
                    result: false
                });
            }

        });
    },
    getRequestsCount: function (port, msg) {
        clog('get requests count', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id] !== undefined) {
                    var viewer = tabs[items[0].id].getViewer();
                    clog('get viewer response: ', viewer);
                    if (viewer != null) {
                        var db = getDb(viewer.id);
                        db.followHistories.where('status').equals(followStatus.requested).count(function (count) {
                            port.postMessage({
                                action: 'callback.getRequestsCount',
                                result: true,
                                count: count
                            });
                        }).catch(function (err) {
                            clog('db count of requests error:' + err);
                            port.postMessage({
                                action: 'callback.getRequestsCount',
                                result: false
                            });
                        });
                    } else {
                        clog('user not logged in');
                        port.postMessage({
                            action: 'callback.getRequestsCount',
                            result: false
                        });
                    }

                } else {
                    clog('get requests count:tab is undefined');
                    port.postMessage({
                        action: 'callback.getRequestsCount',
                        result: false
                    });
                }


            } else {
                clog('get requests count:tab not found');
                port.postMessage({
                    action: 'callback.getRequestsCount',
                    result: false
                });
            }

        });
    },

    backup: function (port, msg) {
        clog('popupCtrl: backup:', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id] !== undefined) {
                    var viewer = tabs[items[0].id].getViewer();
                    var db = getDb(viewer.id);
                    exportDatabase(db).then(function (dbObj) {
                        db.close();
                        dbObj.id = viewer.id;
                        dbObj.username = viewer.username;
                        dbObj.datetime = new Date().toISOString();
                        var json = JSON.stringify(dbObj);
                        var fileName = 'instachi-' + viewer.id + '-' + new Date().toISOString();
                        fileName = fileName.replace('\:', '-').replace('\.', '-') + '.ibak';
                        var blob = new Blob([json], { type: "text/plain;charset=utf-8" });
                        saveAs(blob, fileName);
                        port.postMessage({
                            action: 'callback.backup',
                            result: true,
                            dbObj: dbObj
                        });
                    });
                }
            }
        });
    },

    getProfilePicture: function (port, msg) {
        clog('popupCtrl: get profie picture:', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id] !== undefined) {
                    tabs[items[0].id].postMessage({
                        action: 'getProfilePictureUrl'
                    }, bind(function (msg) {
                        if (msg.result) {
                            chrome.downloads.download({
                                url: msg.url.replace('s150x150', 's1080x1080')
                            });
                            port.postMessage({
                                action: 'callback.getProfilePicture',
                                result: true
                            });
                        } else {
                            port.postMessage({
                                action: 'callback.getProfilePicture',
                                result: false
                            });
                        }
                    }, this));
                } else {
                    clog('tab is undefined');
                }
            } else {
                clog('active tab not found');
            }
        });
    },

    getMedia: function (port, msg) {
        clog('popupCtrl: get media:', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id] !== undefined) {
                    tabs[items[0].id].postMessage({
                        action: 'getMediaUrl'
                    }, bind(function (msg) {
                        if (msg.result) {
                            for(var i in msg.urls){
                                chrome.downloads.download({
                                    url: msg.urls[i]
                                });
                            }
                            port.postMessage({
                                action: 'callback.getMedia',
                                result: true
                            });
                        } else {
                            port.postMessage({
                                action: 'callback.getMedia',
                                result: false
                            });
                        }
                    }, this));
                } else {
                    clog('tab is undefined');
                }
            } else {
                clog('active tab not found');
            }
        });
    }
};
