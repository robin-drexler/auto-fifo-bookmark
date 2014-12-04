
function background(chromeBookmarkService) {
    if (chromeBookmarkService === undefined) {
        return;
    }

    const BOOKMARKS_TO_KEEP = 10;

    var fifoFolderId = "345";

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

background(chrome.bookmarks);