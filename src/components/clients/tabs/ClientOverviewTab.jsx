/**
 * Aba de Visão Geral do Cliente
 * 
 * Exibe informações cadastrais, contatos, endereço e timeline.
 */

import { Mail, Phone, MapPin, FileText, Calendar, User, Building2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDocument, formatPhone, formatZipCode } from '../../../utils/formatters';
import { Labels } from '../../../types/client.types';
import { ClientTimeline } from '../ClientTimeline';

export const ClientOverviewTab = ({ client, onUpdate }) => {
    return (
        <div className="space-y-6">
            {/* Informações Principais */}
            <Section title="Informações Principais">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.tipo && (
                        <InfoRow
                            icon={Building2}
                            label="Tipo"
                            value={Labels.ClientType[client.tipo] || client.tipo}
                        />
                    )}

                    {client.segmento && (
                        <InfoRow
                            icon={Tag}
                            label="Segmento"
                            value={Labels.ClientSegment[client.segmento] || client.segmento}
                        />
                    )}

                    {(client.cnpj || client.cpf || client.document) && (
                        <InfoRow
                            icon={FileText}
                            label={client.cnpj ? 'CNPJ' : 'CPF'}
                            value={formatDocument(client.cnpj || client.cpf || client.document)}
                        />
                    )}

                    {client.inscricaoEstadual && (
                        <InfoRow
                            icon={FileText}
                            label="Inscrição Estadual"
                            value={client.inscricaoEstadual}
                        />
                    )}

                    {client.dataConstituicao && (
                        <InfoRow
                            icon={Calendar}
                            label="Data de Constituição"
                            value={format(new Date(client.dataConstituicao), 'dd/MM/yyyy', { locale: ptBR })}
                        />
                    )}
                </div>
            </Section>

            {/* Contatos */}
            <Section title="Contatos">
                {client.contatos && client.contatos.length > 0 ? (
                    <div className="space-y-4">
                        {client.contatos.map((contato, index) => (
                            <div
                                key={contato.id || index}
                                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {contato.nome}
                                        </h4>
                                        {contato.cargo && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {contato.cargo}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                            {Labels.ContactType[contato.tipo] || contato.tipo}
                                        </span>
                                        {contato.principal && (
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                                Principal
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {contato.email && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Mail className="h-4 w-4" />
                                            <a href={`mailto:${contato.email}`} className="hover:text-primary-600">
                                                {contato.email}
                                            </a>
                                        </div>
                                    )}
                                    {contato.telefone && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Phone className="h-4 w-4" />
                                            <a href={`tel:${contato.telefone}`} className="hover:text-primary-600">
                                                {formatPhone(contato.telefone)}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Fallback para campos legados
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {client.email && (
                            <InfoRow icon={Mail} label="E-mail" value={client.email} isLink={`mailto:${client.email}`} />
                        )}
                        {(client.phone || client.telefone) && (
                            <InfoRow
                                icon={Phone}
                                label="Telefone"
                                value={formatPhone(client.phone || client.telefone)}
                                isLink={`tel:${client.phone || client.telefone}`}
                            />
                        )}
                    </div>
                )}
            </Section>

            {/* Endereço */}
            {(client.endereco || client.address || client.city) && (
                <Section title="Endereço">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Novo sistema */}
                        {client.endereco?.rua && (
                            <InfoRow
                                icon={MapPin}
                                label="Endereço"
                                value={`${client.endereco.rua}${client.endereco.numero ? ', ' + client.endereco.numero : ''}${client.endereco.complemento ? ' - ' + client.endereco.complemento : ''}`}
                            />
                        )}

                        {client.endereco?.bairro && (
                            <InfoRow icon={MapPin} label="Bairro" value={client.endereco.bairro} />
                        )}

                        {(client.endereco?.cidade || client.city) && (
                            <InfoRow
                                icon={MapPin}
                                label="Cidade/Estado"
                                value={`${client.endereco?.cidade || client.city}${(client.endereco?.estado || client.state) ? ' - ' + (client.endereco?.estado || client.state) : ''}`}
                            />
                        )}

                        {(client.endereco?.cep || client.zipCode) && (
                            <InfoRow
                                icon={MapPin}
                                label="CEP"
                                value={formatZipCode(client.endereco?.cep || client.zipCode)}
                            />
                        )}

                        {/* Fallback para sistema legado */}
                        {!client.endereco?.rua && client.address && (
                            <InfoRow icon={MapPin} label="Endereço" value={client.address} />
                        )}
                    </div>
                </Section>
            )}

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
                <Section title="Tags">
                    <div className="flex flex-wrap gap-2">
                        {client.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            {/* Observações */}
            {(client.notes || client.observacoes) && (
                <Section title="Observações">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {client.notes || client.observacoes}
                    </p>
                </Section>
            )}

            {/* Timeline de Atividades */}
            <Section title="Histórico de Atividades">
                <ClientTimeline client={client} />
            </Section>

            {/* Metadata do Sistema */}
            <Section title="Informações do Sistema">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.createdAt && (() => {
                        try {
                            return (
                                <InfoRow
                                    icon={Calendar}
                                    label="Cadastrado em"
                                    value={format(new Date(client.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                />
                            );
                        } catch (e) {
                            return <InfoRow icon={Calendar} label="Cadastrado em" value={client.createdAt} />;
                        }
                    })()}

                    {client.updatedAt && (() => {
                        try {
                            return (
                                <InfoRow
                                    icon={Calendar}
                                    label="Atualizado em"
                                    value={format(new Date(client.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                />
                            );
                        } catch (e) {
                            return <InfoRow icon={Calendar} label="Atualizado em" value={client.updatedAt} />;
                        }
                    })()}

                    {client.createdByEmail && (
                        <InfoRow icon={User} label="Criado por" value={client.createdByEmail} />
                    )}

                    {client.updatedByEmail && (
                        <InfoRow icon={User} label="Atualizado por" value={client.updatedByEmail} />
                    )}

                    {client.database && (
                        <InfoRow icon={FileText} label="Base de Dados" value={client.database} />
                    )}
                </div>
            </Section>
        </div>
    );
};

/**
 * Componente de Seção
 */
const Section = ({ title, children }) => (
    <div className="pt-6 first:pt-0 border-t border-gray-200 dark:border-gray-800 first:border-t-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
        </h3>
        {children}
    </div>
);

/**
 * Componente de Info Row
 */
const InfoRow = ({ icon: Icon, label, value, isLink }) => {
    const content = (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-400" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                    {value || '-'}
                </p>
            </div>
        </div>
    );

    if (isLink) {
        return (
            <a href={isLink} className="hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
                {content}
            </a>
        );
    }

    return <div className="p-2">{content}</div>;
};
