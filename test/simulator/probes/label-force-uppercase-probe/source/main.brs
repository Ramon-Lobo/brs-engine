sub main()
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)
    scene = screen.CreateScene("ProbeScene")
    screen.show()
    l = CreateObject("roSGNode", "Label")
    print "hasField(forceUpperCase)|" + bs(l.hasField("forceUpperCase"))
    print "done"
    screen.close()
end sub

function bs(b as dynamic) as string
    if b = true then return "true"
    return "false"
end function
