import { useState } from 'react';
import { MessageCircle, Phone, Calendar, FileText } from 'lucide-react';
import { Button } from '../../Button';
import { Modal } from '../../Modal';
import toast from 'react-hot-toast';
import { eventService } from '../../../services/eventService';

/**
 * Quick Actions - Ações rápidas para o operador de cobrança
 * Botões de ação no painel do cliente
 */
export const QuickActions = ({ client, onEventAdded }) => {
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [promiseModalOpen, setPromiseModalOpen] = useState(false);

    // Abre WhatsApp
    const handleWhatsApp = () => {
        if (!client?.phone) {
            toast.error('Cliente não possui telefone cadastrado');
            return;
        }

        // Remove caracteres não numéricos
        const cleanPhone = client.phone.replace(/\D/g, '');

        // Adiciona código do país se não tiver
        const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

        // Abre WhatsApp em nova aba
        window.open(`https://wa.me/${phoneWithCountry}`, '_blank');

        toast.success('WhatsApp aberto!');
    };

    return (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Button
                variant="primary"
                size="sm"
                onClick={handleWhatsApp}
                disabled={!client?.phone}
            >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => setContactModalOpen(true)}
            >
                <Phone className="h-4 w-4 mr-2" />
                Registrar Contato
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => setPromiseModalOpen(true)}
            >
                <Calendar className="h-4 w-4 mr-2" />
                Promessa Pagto
            </Button>

            {/* Modal de Registro de Contato */}
            <ContactModal
                isOpen={contactModalOpen}
                onClose={() => setContactModalOpen(false)}
                client={client}
                onEventAdded={onEventAdded}
            />

            {/* Modal de Promessa de Pagamento */}
            <PromiseModal
                isOpen={promiseModalOpen}
                onClose={() => setPromiseModalOpen(false)}
                client={client}
                onEventAdded={onEventAdded}
            />
        </div>
    );
};

/**
 * Modal de Registro de Contato
 */
const ContactModal = ({ isOpen, onClose, client, onEventAdded }) => {
    const [type, setType] = useState('call');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Digite uma descrição do contato');
            return;
        }

        setSaving(true);

        try {
            await eventService.addEvent(client.id, type, description.trim());
            toast.success('Contato registrado com sucesso!');
            setDescription('');
            setType('call');
            onClose();
            if (onEventAdded) onEventAdded();
        } catch (error) {
            console.error('Erro ao registrar contato:', error);
            toast.error('Erro ao registrar contato');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Contato">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Contato */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Contato
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="input"
                    >
                        <option value="call">📞 Ligação</option>
                        <option value="whatsapp">💬 WhatsApp</option>
                        <option value="email">📧 E-mail</option>
                        <option value="visit">🏢 Visita</option>
                    </select>
                </div>

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrição do Contato
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Cliente informou que fará o pagamento amanhã..."
                        rows={4}
                        className="input"
                        required
                    />
                </div>

                {/* Botões */}
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Contato'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

/**
 * Modal de Promessa de Pagamento
 */
const PromiseModal = ({ isOpen, onClose, client, onEventAdded }) => {
    const [promiseDate, setPromiseDate] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!promiseDate) {
            toast.error('Selecione a data da promessa');
            return;
        }

        setSaving(true);

        try {
            const description = `Promessa de pagamento para ${new Date(promiseDate).toLocaleDateString('pt-BR')}${amount ? ` - Valor: R$ ${amount}` : ''
                }${notes ? ` - ${notes}` : ''}`;

            await eventService.addEvent(client.id, 'promise', description, {
                promiseDate,
                amount: amount ? parseFloat(amount) : null,
                notes,
            });

            toast.success('Promessa de pagamento registrada!');
            setPromiseDate('');
            setAmount('');
            setNotes('');
            onClose();
            if (onEventAdded) onEventAdded();
        } catch (error) {
            console.error('Erro ao registrar promessa:', error);
            toast.error('Erro ao registrar promessa');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Promessa de Pagamento">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Data da Promessa */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data Prometida *
                    </label>
                    <input
                        type="date"
                        value={promiseDate}
                        onChange={(e) => setPromiseDate(e.target.value)}
                        className="input"
                        required
                    />
                </div>

                {/* Valor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor (opcional)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="input"
                    />
                </div>

                {/* Observações */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Cliente disse que receberá salário..."
                        rows={3}
                        className="input"
                    />
                </div>

                {/* Botões */}
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Registrar Promessa'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
