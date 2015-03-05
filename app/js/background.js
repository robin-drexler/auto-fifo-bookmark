function background(chromeBookmarkService, fifoFolderId) {

  if (chromeBookmarkService === undefined) {
    return;
  }

  const BOOKMARKS_TO_KEEP = 10;


  function removeSuperfluousNodesFromFifoFolder() {
    chrome.bookmarks.getSubTree(fifoFolderId, function (fifoFolderNode) {
      fifoFolderNode = fifoFolderNode[0]; //not sure why it is an array?

      var toDeleteNodes;

      if (!fifoFolderNode.children) {
        return;
      }

      toDeleteNodes = fifoFolderNode.children.slice(BOOKMARKS_TO_KEEP);

      toDeleteNodes.forEach(function (toDeleteNode) {
        chrome.bookmarks.removeTree(toDeleteNode.id);
      });
    });
  }

  function moveBookmarkToTop(id, cb) {
    chrome.bookmarks.move(id, {index: 0}, function (_) {
      cb();
    });
  }

  function createdHandler(id, changedNode) {
    if (changedNode.parentId !== fifoFolderId) {
      // we only care about changes in our fifo folder
      return;
    }

    moveBookmarkToTop(changedNode.id, removeSuperfluousNodesFromFifoFolder);
  }

  function movedHandler(id, changedNode) {

    if (changedNode.parentId !== fifoFolderId) {
      // we only care about changes in our fifo folder
      return;
    }

    if (changedNode.oldParentId === fifoFolderId) {
      // it was moved inside the folder, to prevent infinite recursion: STAAAP
      return;
    }

    moveBookmarkToTop(id, removeSuperfluousNodesFromFifoFolder);
  }


  chromeBookmarkService.onCreated.addListener(createdHandler);
  chromeBookmarkService.onMoved.addListener(movedHandler);

}


chrome.bookmarks.search({title: '!FIFO!'}, function (results) {
  if (!results.length) {
    return;
  }


  var fifoFolderId = results[0].id;

  background(chrome.bookmarks, fifoFolderId);

  chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
      if (!request.action === 'add') {
        sendResponse({
          status: 'error',
          reason: request.action + ' not found'
        });
        return;
      }

      // XXX maybe checking for title and url might be worth consodering
      chrome.bookmarks.create({
        url: request.url,
        title: request.title,
        parentId: fifoFolderId
      }, function () {
        sendResponse({
          status: 'success'
        });
      });

      // tell chrome sendResponse is going to be resolved async
      return true;
    });

  chrome.commands.onCommand.addListener(function (command) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      var tab = tabs[0];

      chrome.bookmarks.create({
        url: tab.url,
        title: tab.title,
        parentId: fifoFolderId
      });
    });
  });
});