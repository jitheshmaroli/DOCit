import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getAllPlansThunk,
  approvePlanThunk,
  rejectPlanThunk,
  deletePlanThunk,
} from '../../redux/thunks/adminThunk';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { SubscriptionPlan } from '../../types/subscriptionTypes';
import { showSuccess, showError } from '../../utils/toastConfig';
import { BriefcaseMedical, AlertTriangle } from 'lucide-react';

const AdminPlanManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    plans = [],
    loading,
    error,
    totalPages: totalPagesFromState,
  } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const itemsPerPage = 5;

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(
        getAllPlansThunk({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
        })
      );
    }
  }, [dispatch, user?.role, currentPage, searchTerm]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.plans);
  }, [totalPagesFromState.plans]);

  const handleApprovePlan = useCallback(
    async (plan: SubscriptionPlan) => {
      try {
        await dispatch(approvePlanThunk(plan._id)).unwrap();
        showSuccess('Plan approved successfully');
      } catch (err) {
        showError(`Failed to approve plan: ${err}`);
      }
    },
    [dispatch]
  );

  const handleRejectPlan = useCallback(
    async (plan: SubscriptionPlan) => {
      try {
        await dispatch(rejectPlanThunk(plan._id)).unwrap();
        showSuccess('Plan rejected successfully');
      } catch (err) {
        showError(`Failed to reject plan: ${err}`);
      }
    },
    [dispatch]
  );

  const handleDeletePlan = useCallback(async () => {
    if (!selectedPlan) return;
    try {
      await dispatch(deletePlanThunk(selectedPlan._id)).unwrap();
      showSuccess('Plan deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    } catch (err) {
      showError(`Failed to delete plan: ${err}`);
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    }
  }, [dispatch, selectedPlan]);

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: (plan: SubscriptionPlan): React.ReactNode => {
          const maxLength = 20;
          const displayName =
            plan.name && plan.name.length > maxLength
              ? `${plan.name.substring(0, maxLength)}...`
              : plan.name || 'N/A';
          return (
            <span
              className="text-sm font-medium text-text-primary truncate max-w-[150px]"
              title={plan.name || 'N/A'}
            >
              {displayName}
            </span>
          );
        },
      },
      {
        header: 'Doctor',
        accessor: (plan: SubscriptionPlan): React.ReactNode => {
          const doctorName = plan.doctorName || plan.doctorId || 'N/A';
          const maxLength = 20;
          const displayName =
            doctorName.length > maxLength
              ? `${doctorName.substring(0, maxLength)}...`
              : doctorName;
          return (
            <span
              className="text-sm text-text-secondary truncate max-w-[150px]"
              title={doctorName}
            >
              {displayName}
            </span>
          );
        },
      },
      {
        header: 'Price',
        accessor: (plan: SubscriptionPlan): React.ReactNode => (
          <span className="font-medium text-text-primary">
            ₹{plan.price.toFixed(2)}
          </span>
        ),
      },
      {
        header: 'Validity',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          `${plan.validityDays} days`,
      },
      {
        header: 'Status',
        accessor: (plan: SubscriptionPlan): React.ReactNode => (
          <span
            className={`badge ${
              plan.status === 'approved'
                ? 'badge-success'
                : plan.status === 'pending'
                  ? 'badge-warning'
                  : 'badge-error'
            }`}
          >
            {plan.status || 'Pending'}
          </span>
        ),
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: 'Approve',
        onClick: handleApprovePlan,
        className:
          'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
        condition: (plan: SubscriptionPlan) => plan.status === 'pending',
      },
      {
        label: 'Reject',
        onClick: handleRejectPlan,
        className: 'btn-danger text-xs px-3 py-1.5',
        condition: (plan: SubscriptionPlan) => plan.status === 'pending',
      },
      {
        label: 'Delete',
        onClick: (plan: SubscriptionPlan) => {
          setSelectedPlan(plan);
          setIsDeleteModalOpen(true);
        },
        className: 'btn-danger text-xs px-3 py-1.5',
      },
    ],
    [handleApprovePlan, handleRejectPlan]
  );

  const handlePageChange = useCallback(
    (page: number) => setCurrentPage(page),
    []
  );
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <BriefcaseMedical size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="page-title">Plan Management</h1>
            <p className="page-subtitle">
              Review and approve doctor subscription plans
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search plans..."
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable
          data={plans}
          columns={columns}
          actions={actions}
          isLoading={loading}
          error={error}
          onRetry={() =>
            dispatch(
              getAllPlansThunk({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm || undefined,
              })
            )
          }
        />
        <div className="border-t border-surface-border px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {isDeleteModalOpen && selectedPlan && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedPlan(null);
          }}
          title="Delete Plan"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedPlan(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeletePlan} className="btn-danger">
                Delete
              </button>
            </div>
          }
        >
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <p className="pt-1 text-sm text-text-secondary">
              Permanently delete the plan{' '}
              <span className="font-semibold text-text-primary">
                "{selectedPlan.name || 'Unknown'}"
              </span>
              ? This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPlanManagement;
