import React, { useState, useEffect } from 'react'; // CORREGIDO: quitado el punto y coma extra
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { itemLedgerEntryService, itemService } from '../../services/dataService';
import './ItemLedgerEntries.css';

const ItemLedgerEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    ItemNo: '',
    PostingDate: new Date().toISOString().split('T')[0],
    EntryType: 0,
    DocumentNo: '',
    Quantity: '',
    RemainingQuantity: '',
    CostAmountActual: ''
  });

  // Función helper para obtener el texto del tipo de entrada
  const getEntryTypeText = (entryType) => {
    if (entryType === null || entryType === undefined || entryType === '') {
      console.warn('Entry type is null/undefined/empty:', entryType);
      return 'Sin Tipo';
    }
    
    const numericType = parseInt(entryType);
    
    if (isNaN(numericType)) {
      console.warn('Entry type is not a valid number:', entryType, typeof entryType);
      return `Tipo Inválido (${entryType})`;
    }
    
    console.log('Processing entry type:', entryType, 'as numeric:', numericType);
    
    switch(numericType) {
      case 0: return 'Compra';
      case 1: return 'Venta';
      case 2: return 'Ajuste +';
      case 3: return 'Ajuste -';
      case 4: return 'Transferencia';
      case 5: return 'Consumo';
      case 6: return 'Producción';
      default: 
        console.warn('Unknown entry type:', entryType, typeof entryType);
        return `Tipo ${numericType}`;
    }
  };

  // CORREGIDO: useCallback para evitar re-creación de la función
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [entriesResponse, itemsResponse] = await Promise.all([
        itemLedgerEntryService.getAll(),
        itemService.getAll()
      ]);
      
      console.log(`Item Ledger Entries para usuario ${user.id}:`, entriesResponse.data.length);
      
      entriesResponse.data.forEach((entry, index) => {
        const entryType = entry['Entry Type'];
        console.log(`Entry ${index} - Entry Type:`, {
          'Entry No': entry['Entry No_'],
          'Entry Type (raw)': entryType,
          'Entry Type (type)': typeof entryType,
          'Entry Type (parsed)': parseInt(entryType),
          'Is null/undefined': entryType === null || entryType === undefined,
          'Text result': getEntryTypeText(entryType)
        });
      });
      
      setEntries(entriesResponse.data);
      setItems(itemsResponse.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]); // CORREGIDO: incluir user.id como dependencia

  // CORREGIDO: Solo cargar si hay usuario autenticado
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]); // CORREGIDO: incluir fetchData como dependencia

  const reloadData = async () => {
    try {
      const [entriesResponse, itemsResponse] = await Promise.all([
        itemLedgerEntryService.getAll(),
        itemService.getAll()
      ]);
      setEntries(entriesResponse.data);
      setItems(itemsResponse.data);
    } catch (err) {
      setError('Error al recargar datos');
      console.error('Error reloading data:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-actualizar RemainingQuantity cuando cambia Quantity (para nuevas entradas)
      if (name === 'Quantity' && !editingEntry) {
        updated.RemainingQuantity = value;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.ItemNo || !formData.DocumentNo || !formData.Quantity) {
      setError('Por favor complete todos los campos requeridos (Producto, Documento, Cantidad)');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        EntryType: parseInt(formData.EntryType),
        Quantity: formData.Quantity === '' ? 0 : parseFloat(formData.Quantity),
        RemainingQuantity: formData.RemainingQuantity === '' ? 0 : parseFloat(formData.RemainingQuantity),
        CostAmountActual: formData.CostAmountActual === '' ? 0 : parseFloat(formData.CostAmountActual)
      };
      
      console.log(`Enviando datos del movimiento de inventario para usuario ${user.id}:`, dataToSend);
      
      if (editingEntry) {
        await itemLedgerEntryService.update(editingEntry['Entry No_'], dataToSend);
        console.log(`Item Ledger Entry ${editingEntry['Entry No_']} actualizado para usuario ${user.id}`);
      } else {
        await itemLedgerEntryService.create(dataToSend);
        console.log(`Item Ledger Entry creado para usuario ${user.id}`);
      }
      
      await reloadData(); // Usar reloadData en lugar de fetchData
      resetForm();
      setError(null); // Limpiar error si todo sale bien
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al guardar movimiento: ${errorMessage}`);
      console.error('Error saving item ledger entry:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleEdit = (entry) => {
    console.log('Editing entry:', entry);
    setEditingEntry(entry);
    
    // USAR EL NOMBRE EXACTO DEL CAMPO: 'Entry Type'
    const entryType = entry['Entry Type'];
    console.log('Edit - Entry Type:', entryType, typeof entryType);
    
    setFormData({
      ItemNo: entry['Item No_'] || '',
      PostingDate: entry['Posting Date'] 
        ? entry['Posting Date'].split('T')[0] 
        : new Date().toISOString().split('T')[0],
      EntryType: entryType !== null && entryType !== undefined && entryType !== '' ? entryType : 0,
      DocumentNo: entry['Document No_'] || '',
      Quantity: (entry.Quantity || '').toString(),
      RemainingQuantity: (entry['Remaining Quantity'] || '').toString(),
      CostAmountActual: (entry['Cost Amount (Actual)'] || '').toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (entry) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
      try {
        const entryNo = entry['Entry No_'];
        await itemLedgerEntryService.delete(entryNo);
        setEntries(entries.filter(e => e['Entry No_'] !== entryNo));
        console.log(`Item Ledger Entry ${entryNo} eliminado para usuario ${user.id}`);
        setError(null);
      } catch (err) {
        setError('Error al eliminar movimiento');
        console.error('Error deleting item ledger entry:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      ItemNo: '',
      PostingDate: new Date().toISOString().split('T')[0],
      EntryType: 0,
      DocumentNo: '',
      Quantity: '',
      RemainingQuantity: '',
      CostAmountActual: ''
    });
    setEditingEntry(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) return <div className="loading">Cargando movimientos de inventario...</div>;

  return (
    <div className="item-ledger-entries">
      <Header title={`Movimientos de Inventario - ${user?.firstName || 'Usuario'}`} />
      
      <div className="item-ledger-entries-content">
        {error && <div className="error-banner">{error}</div>}
        
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingEntry ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
                <button onClick={resetForm} className="close-button">×</button>
              </div>

              <form onSubmit={handleSubmit} className="entry-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Producto *</label>
                    <select
                      name="ItemNo"
                      value={formData.ItemNo}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {items.map(item => (
                        <option key={item['No_'] || item.No_} value={item['No_'] || item.No_}>
                          {item.Description} ({item['No_'] || item.No_})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="Fecha de Contabilización *"
                    name="PostingDate"
                    type="date"
                    value={formData.PostingDate}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <div className="input-group">
                    <label className="input-label">Tipo de Entrada</label>
                    <select
                      name="EntryType"
                      value={formData.EntryType}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value={0}>Compra</option>
                      <option value={1}>Venta</option>
                      <option value={2}>Ajuste Positivo</option>
                      <option value={3}>Ajuste Negativo</option>
                      <option value={4}>Transferencia</option>
                      <option value={5}>Consumo</option>
                      <option value={6}>Producción</option>
                    </select>
                  </div>
                  
                  <Input
                    label="No. de Documento *"
                    name="DocumentNo"
                    value={formData.DocumentNo}
                    onChange={handleInputChange}
                    required
                    placeholder="Número de documento relacionado"
                  />
                  
                  <Input
                    label="Cantidad *"
                    name="Quantity"
                    type="number"
                    step="0.01"
                    value={formData.Quantity}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                  />
                  
                  <Input
                    label="Cantidad Restante"
                    name="RemainingQuantity"
                    type="number"
                    step="0.01"
                    value={formData.RemainingQuantity}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                  
                  <Input
                    label="Importe Costo Real"
                    name="CostAmountActual"
                    type="number"
                    step="0.01"
                    value={formData.CostAmountActual}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEntry ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="item-ledger-entries-header">
          <div className="item-ledger-entries-actions">
            <Button onClick={() => setShowForm(true)}>
              Nuevo Movimiento
            </Button>
          </div>
        </div>

        <div className="item-ledger-entries-table">
          <table>
            <thead>
              <tr>
                <th>No. Entrada</th>
                <th>Producto</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Doc. No.</th>
                <th>Cantidad</th>
                <th>Cant. Restante</th>
                <th>Costo Real</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                // USAR EL NOMBRE EXACTO DEL CAMPO: 'Entry Type'
                const entryType = entry['Entry Type'];
                return (
                  <tr key={`${entry['Entry No_']}-${index}`}>
                    <td>{entry['Entry No_']}</td>
                    <td>{entry['Item No_']}</td>
                    <td>
                      {entry['Posting Date'] 
                        ? new Date(entry['Posting Date']).toLocaleDateString() 
                        : ''}
                    </td>
                    <td>
                      <span 
                        className="entry-type-debug" 
                        title={`Raw: ${entryType} (${typeof entryType}) | Parsed: ${parseInt(entryType)}`}
                      >
                        {getEntryTypeText(entryType)}
                      </span>
                    </td>
                    <td>{entry['Document No_']}</td>
                    <td>{Number(entry.Quantity || 0).toLocaleString()}</td>
                    <td>{Number(entry['Remaining Quantity'] || 0).toLocaleString()}</td>
                    <td>${Number(entry['Cost Amount (Actual)'] || 0).toLocaleString()}</td>
                    <td>
                      <div className="table-actions">
                        <Button 
                          size="small" 
                          variant="secondary"
                          onClick={() => handleEdit(entry)}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="small" 
                          variant="danger"
                          onClick={() => handleDelete(entry)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {entries.length === 0 && (
            <div className="empty-state">
              <p>No tienes movimientos de inventario registrados</p>
              <Button onClick={() => setShowForm(true)}>+ Agregar primer movimiento</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemLedgerEntries;
