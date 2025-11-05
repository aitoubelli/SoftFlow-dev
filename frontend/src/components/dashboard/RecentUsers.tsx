import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { UserRoleBadge } from "./UserRoleBadge";

export function RecentUsers() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Utilisateurs Récents</CardTitle>
        <p className="text-sm text-muted-foreground">
          Derniers utilisateurs enregistrés dans le système
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">admin</p>
              <p className="text-sm text-muted-foreground">admin@admin.com</p>
            </div>
            <div className="ml-auto font-medium">
              <UserRoleBadge role="admin" />
            </div>
          </div>
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>OM</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">user1</p>
              <p className="text-sm text-muted-foreground">user1@softflow.com</p>
            </div>
            <div className="ml-auto font-medium">
              <UserRoleBadge role="owner" />
            </div>
          </div>
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">johndoe</p>
              <p className="text-sm text-muted-foreground">john@email.com</p>
            </div>
            <div className="ml-auto font-medium">
              <UserRoleBadge role="dev" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
