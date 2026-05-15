import express from 'express';
import supportTicketController from '../controllers/supportTicketController.js';
import * as validators from '../validators/supportTicketValidators.js';

const router = express.Router();

// Ticket CRUD Operations (TESTED & VERIFIED)
router.post(  
  '/',
  validators.createTicketValidator,
  supportTicketController.createTicket
);

router.get(  
  '/',
  validators.paginationValidator,
  supportTicketController.getAllTickets
);

router.get(  
  '/statistics',
  supportTicketController.getTicketStatistics
);

router.get(  
  '/analytics/resolution',
  validators.dateRangeValidator,
  supportTicketController.getTicketResolutionAnalytics
);

router.get(  
  '/dashboard/metrics',
  supportTicketController.getDashboardMetrics
);

router.get(  
  '/overdue',
  supportTicketController.getOverdueTickets
);

router.get(  
  '/escalation-required',
  supportTicketController.getTicketsRequiringEscalation
);

router.get(  
  '/search',
  validators.searchValidator,
  supportTicketController.searchTickets
);

router.get(  
  '/status/:status',
  validators.statusValidator,
  supportTicketController.getTicketsByStatus
);

router.get(  
  '/priority/:priority',
  validators.priorityValidator,
  supportTicketController.getTicketsByPriority
);

router.get(  
  '/category/:category',
  validators.categoryValidator,
  supportTicketController.getTicketsByCategory
);

router.get(  
  '/requester/:email',
  validators.emailValidator,
  supportTicketController.getTicketsByRequester
);

router.get(  
  '/assignee/:userId',
  validators.userIdValidator,
  supportTicketController.getTicketsByAssignee
);

router.get(  
  '/agent/:userId/performance',
  validators.userIdValidator,
  validators.dateRangeValidator,
  supportTicketController.getAgentPerformance
);

router.get(  
  '/number/:ticketNumber',
  validators.ticketNumberValidator,
  supportTicketController.getTicketByNumber
);

router.get(  
  '/:id',
  validators.ticketIdValidator,
  supportTicketController.getTicketById
);

router.put(  
  '/:id',
  validators.ticketIdValidator,
  validators.updateTicketValidator,
  supportTicketController.updateTicket
);

router.patch(  
  '/:id/status',
  validators.ticketIdValidator,
  validators.updateStatusValidator,
  supportTicketController.updateTicketStatus
);

router.delete(  
  '/:id',
  validators.ticketIdValidator,
  supportTicketController.deleteTicket
);

// Ticket Messages (TESTED & VERIFIED)
router.post(  
  '/:id/messages',
  validators.ticketIdValidator,
  validators.addMessageValidator,
  supportTicketController.addMessage
);

router.get(  
  '/:id/messages',
  validators.ticketIdValidator,
  supportTicketController.getTicketMessages
);

// Ticket Assignment (TESTED & VERIFIED)
router.post(  
  '/:id/assign',
  validators.ticketIdValidator,
  validators.assignTicketValidator,
  supportTicketController.assignTicket
);

router.post(  
  '/:id/reassign',
  validators.ticketIdValidator,
  validators.reassignTicketValidator,
  supportTicketController.reassignTicket
);

// Ticket Actions (TESTED & VERIFIED)
router.post(  
  '/:id/escalate',
  validators.ticketIdValidator,
  validators.escalateTicketValidator,
  supportTicketController.escalateTicket
);

router.post(  
  '/:id/resolve',
  validators.ticketIdValidator,
  validators.resolveTicketValidator,
  supportTicketController.resolveTicket
);

router.post(  
  '/:id/close',
  validators.ticketIdValidator,
  supportTicketController.closeTicket
);

router.post(  
  '/:id/reopen',
  validators.ticketIdValidator,
  validators.reopenTicketValidator,
  supportTicketController.reopenTicket
);

// Ticket Attachments (TESTED & VERIFIED)
router.post(  
  '/:id/attachments',
  validators.ticketIdValidator,
  validators.addAttachmentValidator,
  supportTicketController.addAttachment
);

// Related Tickets (TESTED & VERIFIED)
router.post(  
  '/:id/related',
  validators.ticketIdValidator,
  validators.linkRelatedTicketsValidator,
  supportTicketController.linkRelatedTickets
);

// Satisfaction Surveys (TESTED & VERIFIED)
router.post(  
  '/:id/satisfaction/survey',
  validators.ticketIdValidator,
  validators.submitSatisfactionSurveyValidator,
  supportTicketController.submitSatisfactionSurvey
);

router.post(  
  '/:id/satisfaction/send',
  validators.ticketIdValidator,
  supportTicketController.sendSatisfactionSurvey
);

export default router;