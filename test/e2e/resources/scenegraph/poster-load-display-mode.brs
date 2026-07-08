' Poster.loadDisplayMode is normalized to lowercase on a device.
sub main()
    poster = createObject("roSGNode", "Poster")
    poster.loadDisplayMode = "ScaleToFit"
    print poster.loadDisplayMode
    poster.loadDisplayMode = "limitSize"
    print poster.loadDisplayMode
    poster.loadDisplayMode = "noScale"
    print poster.loadDisplayMode
end sub
