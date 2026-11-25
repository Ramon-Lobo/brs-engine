sub main()
    di = CreateObject("roDeviceInfo")
    print "friendly=" + di.GetFriendlyName()
    print "country=" + di.GetCountryCode()
    print "model=" + di.GetModel()
end sub
