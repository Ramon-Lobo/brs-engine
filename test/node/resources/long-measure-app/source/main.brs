sub Main()
    print "=== Long Measure ==="
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)
    scene = screen.CreateScene("MainScene")
    screen.show()
    print "label set start"
    ' One long statement on the render thread: ellipsizing this text measures it over and over
    scene.findNode("lbl").text = String(30000, "a")
    print "label set done"
    while true
        msg = wait(20, port)
        if type(msg) = "roSGScreenEvent" and msg.isScreenClosed() then exit while
    end while
end sub
