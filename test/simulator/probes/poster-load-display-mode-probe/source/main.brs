sub main()
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)
    scene = screen.CreateScene("ProbeScene")
    screen.show()
    p = CreateObject("roSGNode", "Poster")
    p.loadDisplayMode = "ScaleToFit"
    emit("loadDisplayMode", p.loadDisplayMode)
    p.loadDisplayMode = "limitSize"
    emit("loadDisplayMode_limitSize", p.loadDisplayMode)
    print "done"
    screen.close()
end sub

sub emit(id as string, v as string)
    print id + "|" + v
    sleep(15)
end sub

function bs(b as dynamic) as string
    if b = true then return "true"
    return "false"
end function
