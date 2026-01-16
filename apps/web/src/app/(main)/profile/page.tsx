'use client';

import { useEffect, useState } from 'react';
import { User, MapPin, Warehouse, Smartphone, Settings, Shield, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getUser, getErpDetails, AuthUser, ErpDetails } from '@/lib/auth';

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [erpDetails, setErpDetails] = useState<ErpDetails | null>(null);
  const [salesapp, setSalesapp] = useState<any>(null);

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = getUser();
    const savedErpDetails = getErpDetails();
    
    // Get salesapp data
    const salesappData = localStorage.getItem('auth_salesapp');
    
    setUser(savedUser);
    setErpDetails(savedErpDetails);
    if (salesappData) {
      setSalesapp(JSON.parse(salesappData));
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Профайл</h1>
        <p className="text-muted-foreground">Таны хэрэглэгчийн мэдээлэл</p>
      </div>

      <div className="grid gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{salesapp?.name || user.name}</CardTitle>
                <CardDescription className="text-base">
                  @{salesapp?.username || user.username || user.corporate_id}
                </CardDescription>
              </div>
              <Badge 
                variant={salesapp?.is_active || user.is_active ? "default" : "secondary"}
                className="ml-auto"
              >
                {salesapp?.is_active || user.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-medium">{salesapp?.id || user.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Төрөл</p>
                <Badge variant="outline">
                  {salesapp?.account_type === 'individual' ? 'Хувь хүн' : 'Байгууллага'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Дэд төрөл</p>
                <Badge variant="outline">
                  {salesapp?.sub_type === 'employee' ? 'Ажилтан' : 
                   salesapp?.sub_type === 'partner' ? 'Түншлэгч' : 
                   salesapp?.sub_type === 'customer' ? 'Харилцагч' : salesapp?.sub_type}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Info Card */}
        {erpDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Маршрутын мэдээлэл
              </CardTitle>
              <CardDescription>Таны хуваарилагдсан маршрут</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Маршрутын нэр</p>
                  <p className="font-medium">{erpDetails.routeName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Маршрутын ID</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {erpDetails.routeId}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Хамрах хүрээ</p>
                  <p className="font-medium">{erpDetails.routeRange} м</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">App хувилбар</p>
                  <Badge variant="secondary">{erpDetails.appLastVersion || 'N/A'}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">IMEI</p>
                  <p className="font-mono text-xs">{erpDetails.routeIMEI}</p>
                </div>
                {erpDetails.routeBussinesRegion && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Бизнес бүс</p>
                    <p className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                      {erpDetails.routeBussinesRegion}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warehouses Card */}
        {erpDetails?.warehouses && erpDetails.warehouses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-orange-500" />
                Агуулахууд
              </CardTitle>
              <CardDescription>Хандах боломжтой агуулахууд</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {erpDetails.warehouses.map((wh, index) => (
                  <div 
                    key={wh.uuid} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{wh.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{wh.uuid}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {wh.isdefault && (
                        <Badge variant="default" className="bg-primary">Үндсэн</Badge>
                      )}
                      {wh.isSale && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Борлуулалт</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* IMEI Codes Card */}
        {erpDetails?.imeiCode && erpDetails.imeiCode.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                Бүртгэлтэй төхөөрөмжүүд
              </CardTitle>
              <CardDescription>Зөвшөөрөгдсөн IMEI кодууд</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {erpDetails.imeiCode.map((imei, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm font-mono">{imei.routeIMEI}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Type Info */}
        {erpDetails?.warehouses && erpDetails.warehouses[0]?.priceTypeId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                Системийн тохиргоо
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Үнийн төрлийн ID</p>
                <p className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                  {erpDetails.warehouses[0].priceTypeId}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
