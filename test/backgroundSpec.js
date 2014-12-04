describe("background", function () {

    function createBookmarkService() {
        return {
            onCreated: {
                addListener: function () {

                }
            },
            onMoved: {
                addListener: function () {

                }
            }
        };
    }

    it("adds listener to created", function () {
        var bookmarkService = createBookmarkService();

        spyOn(bookmarkService.onCreated, 'addListener');

        background(bookmarkService);
        expect(bookmarkService.onCreated.addListener).toHaveBeenCalled();
    });

});