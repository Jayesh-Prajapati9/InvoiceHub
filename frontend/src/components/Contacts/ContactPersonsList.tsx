import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import ConfirmModal from '../ConfirmModal';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ContactPersonForm from './ContactPersonForm';

interface ContactPersonsListProps {
  contactId: string;
}

const ContactPersonsList = ({ contactId }: ContactPersonsListProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: persons, isLoading } = useQuery({
    queryKey: ['contactPersons', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}/persons`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (personId: string) => {
      await api.delete(`/contacts/${contactId}/persons/${personId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPersons', contactId] });
    },
  });

  const handleEdit = (person: any) => {
    setEditingPerson(person);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingPerson(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPerson(null);
  };

  if (isLoading) {
    return (
      <div className="card">
        <p className="text-gray-600">Loading contact persons...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Contact Persons</h3>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
          title="Add Contact Person"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <ContactPersonForm
            contactId={contactId}
            person={editingPerson}
            onClose={handleFormClose}
          />
        </div>
      )}

      {persons && persons.length > 0 ? (
        <div className="space-y-3">
          {persons.map((person: any) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">{person.name}</p>
                  {person.isPrimary && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded">
                      Primary
                    </span>
                  )}
                </div>
                {person.designation && (
                  <p className="text-xs text-gray-600 mt-1">{person.designation}</p>
                )}
                <div className="mt-1 space-x-3 text-xs text-gray-600">
                  {person.email && <span>{person.email}</span>}
                  {person.phone && <span>{person.phone}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(person)}
                  className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setPendingDeleteId(person.id);
                    setDeleteModalOpen(true);
                  }}
                  className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-gray-600 mb-4">No contact persons found.</p>
          <button 
            onClick={handleAdd} 
            className="btn-primary text-sm inline-flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Contact Person
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteMutation.mutate(pendingDeleteId);
          }
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
        }}
        title="Delete Contact Person"
        message="Are you sure you want to delete this contact person? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default ContactPersonsList;

