"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NavigationHeader } from "@/components/dashboard/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserRoleBadge } from "@/components/dashboard/UserRoleBadge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  User,
  Mail,
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  X,
  Calendar,
  FolderOpen,
  AlertCircle
} from "lucide-react";

interface ProfileData {
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'owner' | 'dev';
    createdAt: string;
    updatedAt: string;
  };
  projects: Array<{
    _id: string;
    name: string;
    description: string;
    role: 'owner' | 'dev';
    createdAt: string;
  }>;
}

const Profile = () => {
  const { user, isAuthenticated, logout, loading, token, refreshUser } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [saving, setSaving] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
      return;
    }
  }, [loading, isAuthenticated, router]);

  // Fetch profile data
  useEffect(() => {
    if (user && token) {
      fetchProfileData();
    }
  }, [user, token]);

  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);
      setError(null);

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      setProfileData(data);

      // Initialize edit form with current name
      setEditForm(prev => ({
        ...prev,
        name: data.user.name
      }));
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Erreur lors du chargement des données du profil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate form
      if (!editForm.name.trim()) {
        setError('Le nom ne peut pas être vide.');
        return;
      }

      if (editForm.newPassword || editForm.confirmPassword) {
        if (!editForm.currentPassword) {
          setError('Le mot de passe actuel est requis pour changer le mot de passe.');
          return;
        }
        if (editForm.newPassword !== editForm.confirmPassword) {
          setError('Les nouveaux mots de passe ne correspondent pas.');
          return;
        }
        if (editForm.newPassword.length < 8) {
          setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
          return;
        }
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          currentPassword: editForm.currentPassword || undefined,
          newPassword: editForm.newPassword || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedData = await response.json();

      // Refresh profile data
      await fetchProfileData();

      // Refresh user context to update sidebar and other components
      await refreshUser();

      // Reset form
      setEditForm({
        name: updatedData.user.name,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: profileData?.user.name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading || loadingProfile) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'md:ml-[60px]' : 'md:ml-[220px] lg:ml-[280px]'}`}>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement du profil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profileData) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'md:ml-[60px]' : 'md:ml-[220px] lg:ml-[280px]'}`}>
        <NavigationHeader
          isMobile={isMobile}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          user={user}
          logout={logout}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Information Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations du Profil
                  </CardTitle>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Modifier
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Profile Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/avatar-placeholder.jpg" alt="Avatar" />
                      <AvatarFallback className="text-lg">
                        {user.name ? user.name.charAt(0) : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{profileData.user.name}</h3>
                      <UserRoleBadge role={profileData.user.role} />
                    </div>
                  </div>

                  <Separator />

                  {/* Edit Form */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium">Nom</label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Votre nom"
                        />
                      </div>

                      <div>
                        <label htmlFor="currentPassword" className="text-sm font-medium">Mot de passe actuel</label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={editForm.currentPassword}
                            onChange={(e) => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Mot de passe actuel"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="text-sm font-medium">Nouveau mot de passe</label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={editForm.newPassword}
                            onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Nouveau mot de passe (optionnel)"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={editForm.confirmPassword}
                            onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirmer le nouveau mot de passe"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} disabled={saving}>
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Nom:</span>
                        <span className="font-medium">{profileData.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="font-medium">{profileData.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Rôle:</span>
                        <UserRoleBadge role={profileData.user.role} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Membre depuis:</span>
                        <span className="font-medium">{formatDate(profileData.user.createdAt)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Projects Card */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Mes Projets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileData.projects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Aucun projet trouvé.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {profileData.projects.map((project) => (
                        <div key={project._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-muted-foreground">{project.description}</p>
                            )}
                          </div>
                          <Badge variant={project.role === 'owner' ? 'default' : 'secondary'}>
                            {project.role === 'owner' ? 'Propriétaire' : 'Développeur'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
