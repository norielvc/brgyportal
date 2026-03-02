const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

const router = express.Router();

/**
 * @route   GET /api/events
 * @desc    Get all carousel events (public)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch events'
      });
    }

    res.status(200).json({
      success: true,
      data: events || []
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, body, date, image } = req.body;

    // Get max order_index
    const { data: maxOrder } = await supabase
      .from('events')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = (maxOrder?.order_index || 0) + 1;

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title,
        description,
        body: body || '',
        date,
        image: image || '/background.jpg',
        order_index: newOrderIndex
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create event'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, body, date, image, order_index } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (body !== undefined) updateData.body = body;
    if (date) updateData.date = date;
    if (image) updateData.image = image;
    if (order_index !== undefined) updateData.order_index = order_index;
    updateData.updated_at = new Date().toISOString();

    const { data: event, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update event'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/events/bulk
 * @desc    Bulk update all events (for reordering)
 * @access  Private (Admin only)
 */
router.put('/bulk/update', authenticateToken, async (req, res) => {
  try {
    const { events } = req.body;

    // Delete all existing events and insert new ones
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (events && events.length > 0) {
      const eventsToInsert = events.map((event, index) => ({
        title: event.title,
        description: event.description,
        body: event.body || '',
        date: event.date,
        image: event.image || '/background.jpg',
        order_index: index
      }));

      const { error } = await supabase.from('events').insert(eventsToInsert);

      if (error) {
        console.error('Error bulk updating events:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update events'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Events updated successfully'
    });
  } catch (error) {
    console.error('Bulk update events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete event'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
