describe('ROOM_NAME', function () {
  beforeEach(module('video_conference'));

  var $location, ROOM_NAME;

  beforeEach(inject(function (_$location_, _ROOM_NAME_) {
    $location = _$location_;
    ROOM_NAME = _ROOM_NAME_;
  }));

  it('gets the last part of the URL as the roomname', function () {
    spyOn($location, 'url').and.returnValue('/vids/testing');

    expect(ROOM_NAME()).toEqual('/testing');
  });
});