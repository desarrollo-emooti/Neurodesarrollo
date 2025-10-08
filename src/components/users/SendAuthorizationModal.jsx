import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Send, Mail, AlertCircle, CheckCircle2, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

const DEFAULT_MESSAGE = `Estimado/a {NOMBRE},

Le enviamos esta invitación para completar su registro en la plataforma EMOOTI.

Por favor, acceda al siguiente enlace para establecer su contraseña y activar su cuenta:

{LINK_ACTIVACION}

Este enlace es válido durante 7 días.

Si tiene alguna duda, no dude en contactarnos.

Atentamente,
Equipo EMOOTI`;

export default function SendAuthorizationModal({ open, onClose, selectedUsers = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState(DEFAULT_MESSAGE);
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [sendResults, setSendResults] = useState(null);

  React.useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setCustomMessage(DEFAULT_MESSAGE);
    setUseCustomMessage(false);
    setSendResults(null);
  };

  const getEligibleUsers = () => {
    // Filter users that can receive authorization
    // Only users with status 'pending_invitation' or those without a password
    return selectedUsers.filter(user =>
      user.status === 'pending_invitation' || !user.has_password
    );
  };

  const getIneligibleUsers = () => {
    // Users that already have authorization sent or are already active
    return selectedUsers.filter(user =>
      user.status === 'active' || user.status === 'invitation_sent'
    );
  };

  const eligibleUsers = getEligibleUsers();
  const ineligibleUsers = getIneligibleUsers();

  const handleSendAuthorizations = async () => {
    if (eligibleUsers.length === 0) {
      toast.error('No hay usuarios elegibles para enviar autorizaciones');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.users.sendAuthorizations({
        user_ids: eligibleUsers.map(u => u.id),
        custom_message: useCustomMessage ? customMessage : null,
      });

      const results = response.data.data;
      setSendResults(results);

      if (results.success > 0) {
        toast.success(`${results.success} autorización(es) enviada(s) correctamente`);
        onSuccess?.();
      }

      if (results.failed > 0) {
        toast.warning(`${results.failed} autorización(es) no pudieron ser enviadas`);
      }
    } catch (error) {
      console.error('Error sending authorizations:', error);
      toast.error(error.response?.data?.message || 'Error al enviar autorizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset after a delay to avoid flash
      setTimeout(resetForm, 300);
    }
  };

  const renderUsersList = (users, title, icon, color, bgColor, borderColor) => {
    if (users.length === 0) return null;

    const Icon = icon;

    return (
      <Card className={cn('p-4', bgColor, borderColor)}>
        <div className="flex items-start space-x-3 mb-3">
          <Icon className={cn('w-5 h-5 mt-0.5', color)} />
          <div className="flex-1">
            <p className={cn('text-sm font-medium', color)}>{title}</p>
            <p className={cn('text-xs mt-1', color)}>{users.length} usuario(s)</p>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between bg-white p-3 rounded border"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emooti-blue-400 to-emooti-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
              <Badge variant="outline">{user.user_type}</Badge>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (sendResults) {
    // Show results screen
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Envío Completado</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-900">{sendResults.total}</p>
                  <p className="text-xs text-blue-700 mt-1">Total</p>
                </div>
              </Card>

              <Card className="p-4 bg-green-50 border-green-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-900">{sendResults.success}</p>
                  <p className="text-xs text-green-700 mt-1">Enviados</p>
                </div>
              </Card>

              <Card className="p-4 bg-red-50 border-red-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-900">{sendResults.failed}</p>
                  <p className="text-xs text-red-700 mt-1">Fallidos</p>
                </div>
              </Card>
            </div>

            {/* Failed Users Details */}
            {sendResults.failed_users && sendResults.failed_users.length > 0 && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-sm font-medium text-red-900 mb-3">Usuarios con error:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sendResults.failed_users.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-red-200">
                      <p className="text-sm font-medium text-gray-900">{item.user.email}</p>
                      <p className="text-xs text-red-700 mt-1">{item.error}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Enviar Autorizaciones</span>
          </DialogTitle>
          <DialogDescription>
            Envíe invitaciones por email para que los usuarios completen su registro
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-6">
          {/* Summary Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {eligibleUsers.length} usuario(s) recibirá(n) la invitación
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Se enviará un email con un enlace de activación válido por 7 días
                </p>
              </div>
            </div>
          </Card>

          {/* Eligible Users */}
          {renderUsersList(
            eligibleUsers,
            'Usuarios que recibirán la autorización',
            CheckCircle2,
            'text-green-900',
            'bg-green-50',
            'border-green-200'
          )}

          {/* Ineligible Users */}
          {renderUsersList(
            ineligibleUsers,
            'Usuarios ya autorizados (se omitirán)',
            Clock,
            'text-amber-900',
            'bg-amber-50',
            'border-amber-200'
          )}

          {/* Custom Message Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-custom-message"
                checked={useCustomMessage}
                onCheckedChange={setUseCustomMessage}
              />
              <Label htmlFor="use-custom-message" className="cursor-pointer">
                Personalizar mensaje del email
              </Label>
            </div>

            {useCustomMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="p-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Mensaje personalizado
                  </Label>
                  <p className="text-xs text-gray-600 mb-3">
                    Variables disponibles: {'{NOMBRE}'}, {'{LINK_ACTIVACION}'}
                  </p>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Escriba su mensaje personalizado..."
                  />
                </Card>
              </motion.div>
            )}
          </div>

          {/* Warning */}
          {eligibleUsers.length === 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    No hay usuarios elegibles
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Todos los usuarios seleccionados ya han sido autorizados o están activos
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSendAuthorizations}
            disabled={loading || eligibleUsers.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading
              ? 'Enviando...'
              : `Enviar ${eligibleUsers.length} Autorización(es)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
