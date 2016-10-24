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
        clog('get current task', msg);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (items) {
            if (items.length > 0) {
                if (tabs[items[0].id].task != undefined) {
                    clog('task found');
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
                        db.followHistories.where('status').equals('following').count(function (count) {
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
                        db.followHistories.where('status').equals('requested').count(function (count) {
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
    }
};
