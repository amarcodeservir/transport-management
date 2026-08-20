import express from 'express';
import {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    toggleStatus
} from '../controllers/customerController.js';
import { authorizeRoles, verifyToken } from '../middlelware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRoles('super_admin', 'organization_admin'), createCustomer);
router.get('/', verifyToken, authorizeRoles('super_admin', 'organization_admin', 'customer'), getAllCustomers);
router.get('/:id', verifyToken, authorizeRoles('super_admin', 'organization_admin', 'customer'), getCustomerById);
router.put('/:id', verifyToken, authorizeRoles('super_admin', 'organization_admin', 'customer'), updateCustomer);
router.delete('/:id', verifyToken, authorizeRoles('super_admin', 'organization_admin'), deleteCustomer);
router.patch('/:id/status', verifyToken, authorizeRoles('super_admin', 'organization_admin'), toggleStatus);

export default router;
