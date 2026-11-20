' Assigning invalid to a scalar SceneGraph field resets it to the type default (device behavior).
sub main()
    node = createObject("roSGNode", "Node")

    node.addField("i", "integer", false)
    node.i = 5
    node.i = invalid
    print node.i

    node.addField("fl", "float", false)
    node.fl = 2.5
    node.fl = invalid
    print node.fl

    node.addField("s", "string", false)
    node.s = "abc"
    node.s = invalid
    print "[" + node.s + "]"

    node.addField("b", "boolean", false)
    node.b = true
    node.b = invalid
    print node.b

    ' fields that hold objects keep accepting invalid
    node.addField("aa", "assocarray", false)
    node.aa = { a: 1 }
    node.aa = invalid
    print (node.aa = invalid)
end sub
