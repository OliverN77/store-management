import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // AGREGAR useAuth
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { purchaseLineService, purchaseHeaderService, itemService } from '../../services/dataService';
import './PurchaseLines.css';

const PurchaseLines = () => {
  const { user } = useAuth();
  const [purchaseLines, setPurchaseLines] = useState([]);
  const [purchaseHeaders, setPurchaseHeaders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [formData, setFormData] = useState({
    DocumentType: 1,
    DocumentNo: '',
    LineNo: '',
    Type: 2, // 2 = Item
    No_: '',
    Description: '',
    Quantity: '',
    UnitOfMeasureCode: 'UND',
    DirectUnitCost: '',
    LineDiscountPct: '',
    LineAmount: ''
  });

  // Debug: log formData cuando cambie
  useEffect(() => {
    console.log('PurchaseLines formData:', formData);
  }, [formData]);

  // CORREGIDO: useCallback para fetchData
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [linesResponse, headersResponse, itemsResponse] = await Promise.all([
        purchaseLineService.getAll(),
        purchaseHeaderService.getAll(),
        itemService.getAll()
      ]);
      
      console.log(`Purchase Lines para usuario ${user.id}:`, linesResponse.data.length);
      setPurchaseLines(linesResponse.data);
      setPurchaseHeaders(headersResponse.data);
      setItems(itemsResponse.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]); // CORREGIDO: incluir user.id como dependencia

  // CORREGIDO: incluir fetchData como dependencia
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]); // CORREGIDO: incluir fetchData

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('PurchaseLines input change:', { name, value });
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calcular automáticamente el importe de línea cuando cambian cantidad o precio
      if (name === 'Quantity' || name === 'DirectUnitCost' || name === 'LineDiscountPct') {
        const quantity = parseFloat(name === 'Quantity' ? value : updated.Quantity) || 0;
        const directUnitCost = parseFloat(name === 'DirectUnitCost' ? value : updated.DirectUnitCost) || 0;
        const discountPct = parseFloat(name === 'LineDiscountPct' ? value : updated.LineDiscountPct) || 0;
        
        const lineAmount = quantity * directUnitCost;
        const discountAmount = (lineAmount * discountPct) / 100;
        const finalAmount = lineAmount - discountAmount;
        
        updated.LineAmount = finalAmount.toFixed(2);
      }
      
      // Auto-completar descripción cuando se selecciona un producto
      if (name === 'No_' && value) {
        const selectedItem = items.find(item => item['No_'] === value);
        if (selectedItem) {
          updated.Description = selectedItem.Description || '';
          updated.DirectUnitCost = selectedItem.UnitCost || selectedItem['Unit Cost'] || selectedItem.LastDirectCost || selectedItem['Last Direct Cost'] || '';
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.DocumentNo || !formData.LineNo || !formData.No_ || !formData.Quantity || !formData.DirectUnitCost) {
      setError('Por favor complete todos los campos requeridos (Documento, Línea, Producto, Cantidad, Costo)');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        DocumentType: parseInt(formData.DocumentType),
        LineNo: parseInt(formData.LineNo),
        Type: parseInt(formData.Type),
        Quantity: formData.Quantity === '' ? 0 : parseFloat(formData.Quantity),
        DirectUnitCost: formData.DirectUnitCost === '' ? 0 : parseFloat(formData.DirectUnitCost),
        LineDiscountPct: formData.LineDiscountPct === '' ? 0 : parseFloat(formData.LineDiscountPct),
        LineAmount: formData.LineAmount === '' ? 0 : parseFloat(formData.LineAmount)
      };
      
      console.log(`Enviando datos de línea de compra para usuario ${user.id}:`, dataToSend);
      
      if (editingLine) {
        const documentNo = editingLine['Document No_'] || editingLine.DocumentNo;
        const lineNo = editingLine['Line No_'] || editingLine.LineNo;
        const lineId = `${documentNo}-${lineNo}`;
        await purchaseLineService.update(lineId, dataToSend);
        console.log(`Purchase Line ${lineId} actualizada para usuario ${user.id}`);
      } else {
        await purchaseLineService.create(dataToSend);
        console.log(`Purchase Line creada para usuario ${user.id}`);
      }
      
      await fetchData(); // Recargar datos después de crear/actualizar
      resetForm();
      setError(null); // Limpiar error si todo sale bien
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al guardar línea de compra: ${errorMessage}`);
      console.error('Error saving purchase line:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleEdit = (line) => {
    console.log('Editing line:', line);
    setEditingLine(line);
    setFormData({
      DocumentType: line['Document Type'] || line.DocumentType || 1,
      DocumentNo: line['Document No_'] || line.DocumentNo || '',
      LineNo: (line['Line No_'] || line.LineNo || '').toString(),
      Type: line.Type || 2,
      No_: line['No_'] || '',
      Description: line.Description || '',
      Quantity: (line.Quantity || '').toString(),
      UnitOfMeasureCode: line['Unit of Measure Code'] || line.UnitOfMeasureCode || 'UND',
      DirectUnitCost: (line['Direct Unit Cost'] || line.DirectUnitCost || '').toString(),
      LineDiscountPct: (line['Line Discount %'] || line.LineDiscountPct || '').toString(),
      LineAmount: (line['Line Amount'] || line.LineAmount || '').toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (line) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta línea de compra?')) {
      try {
        const documentNo = line['Document No_'] || line.DocumentNo;
        const lineNo = line['Line No_'] || line.LineNo;
        const lineId = `${documentNo}-${lineNo}`;
        await purchaseLineService.delete(lineId);
        setPurchaseLines(purchaseLines.filter(l => 
          !((l['Document No_'] || l.DocumentNo) === documentNo && 
            (l['Line No_'] || l.LineNo) === lineNo)
        ));
        console.log(`Purchase Line ${lineId} eliminada para usuario ${user.id}`);
        setError(null);
      } catch (err) {
        setError('Error al eliminar línea de compra');
        console.error('Error deleting purchase line:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      DocumentType: 1,
      DocumentNo: '',
      LineNo: '',
      Type: 2,
      No_: '',
      Description: '',
      Quantity: '',
      UnitOfMeasureCode: 'UND',
      DirectUnitCost: '',
      LineDiscountPct: '',
      LineAmount: ''
    });
    setEditingLine(null);
    setShowForm(false);
    setError(null);
  };

  // MEJORADO: Función para obtener el siguiente número de línea único
  const getNextLineNo = (documentNo) => {
    const linesForDoc = purchaseLines.filter(line => 
      (line['Document No_'] || line.DocumentNo) === documentNo
    );
    
    if (linesForDoc.length === 0) {
      // Agregar el userId multiplicado por 1000000 para hacer números únicos por usuario
      return (10000 + (user.id * 1000000)).toString();
    }
    
    const maxLineNo = Math.max(...linesForDoc.map(line => 
      parseInt(line['Line No_'] || line.LineNo || 0)
    ));
    
    return (maxLineNo + 10000).toString();
  };

  // MEJORADO: Actualizar el número de línea cuando cambia el documento
  const handleDocumentChange = (e) => {
    const documentNo = e.target.value;
    const nextLineNo = getNextLineNo(documentNo);
    
    console.log(`Document changed to ${documentNo}, setting Line No to ${nextLineNo} for user ${user.id}`);
    
    setFormData(prev => ({
      ...prev,
      DocumentNo: documentNo,
      LineNo: nextLineNo
    }));
  };

  if (loading) return <div className="loading">Cargando líneas de compra...</div>;

  return (
    <div className="purchase-lines">
      <Header title={`Líneas de Compra - ${user?.firstName || 'Usuario'}`} />
      
      <div className="purchase-lines-content">
        {error && <div className="error-banner">{error}</div>}
        
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingLine ? 'Editar Línea de Compra' : 'Nueva Línea de Compra'}</h3>
                <button onClick={resetForm} className="close-button">×</button>
              </div>

              <form onSubmit={handleSubmit} className="purchase-line-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Tipo de Documento</label>
                    <select
                      name="DocumentType"
                      value={formData.DocumentType}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value={1}>Orden</option>
                      <option value={2}>Factura</option>
                      <option value={3}>Nota Crédito</option>
                      <option value={0}>Cotización</option>
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">No. de Documento *</label>
                    <select
                      name="DocumentNo"
                      value={formData.DocumentNo}
                      onChange={handleDocumentChange}
                      className="input"
                      required
                    >
                      <option value="">Seleccionar orden</option>
                      {purchaseHeaders.map(header => (
                        <option key={header['No_']} value={header['No_']}>
                          {header['No_']} - Proveedor: {header['Buy-from Vendor No_'] || header.BuyfromVendorNo}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="No. de Línea *"
                    name="LineNo"
                    type="number"
                    value={formData.LineNo}
                    onChange={handleInputChange}
                    required
                    disabled={editingLine}
                    placeholder="10000"
                  />
                  
                  <div className="input-group">
                    <label className="input-label">Tipo</label>
                    <select
                      name="Type"
                      value={formData.Type}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value={2}>Producto</option>
                      <option value={1}>Cuenta Mayor</option>
                      <option value={3}>Recurso</option>
                      <option value={4}>Activo Fijo</option>
                      <option value={5}>Cargo</option>
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Producto *</label>
                    <select
                      name="No_"
                      value={formData.No_}
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
                    label="Descripción"
                    name="Description"
                    value={formData.Description}
                    onChange={handleInputChange}
                  />
                  
                  <Input
                    label="Cantidad *"
                    name="Quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.Quantity}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                  />
                  
                  <Input
                    label="Unidad de Medida"
                    name="UnitOfMeasureCode"
                    value={formData.UnitOfMeasureCode}
                    onChange={handleInputChange}
                    placeholder="UND"
                  />
                  
                  <Input
                    label="Costo Unitario Directo *"
                    name="DirectUnitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.DirectUnitCost}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                  />
                  
                  <Input
                    label="% Descuento Línea"
                    name="LineDiscountPct"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.LineDiscountPct}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  
                  <Input
                    label="Importe Línea"
                    name="LineAmount"
                    type="number"
                    step="0.01"
                    value={formData.LineAmount}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>

                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingLine ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="purchase-lines-header">
          <div className="purchase-lines-actions">
            <Button onClick={() => setShowForm(true)}>
              Nueva Línea de Compra
            </Button>
          </div>
        </div>

        <div className="purchase-lines-table">
          <table>
            <thead>
              <tr>
                <th>Doc. No.</th>
                <th>Línea No.</th>
                <th>Producto</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
                <th>% Desc.</th>
                <th>Importe</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {purchaseLines.map((line, index) => (
                <tr key={`${line['Document No_'] || line.DocumentNo}-${line['Line No_'] || line.LineNo}-${index}`}>
                  <td>{line['Document No_'] || line.DocumentNo}</td>
                  <td>{line['Line No_'] || line.LineNo}</td>
                  <td>{line['No_']}</td>
                  <td>{line.Description}</td>
                  <td>{Number(line.Quantity || 0).toLocaleString()}</td>
                  <td>${Number(line['Direct Unit Cost'] || line.DirectUnitCost || 0).toLocaleString()}</td>
                  <td>{Number(line['Line Discount %'] || line.LineDiscountPct || 0)}%</td>
                  <td>${Number(line['Line Amount'] || line.LineAmount || 0).toLocaleString()}</td>
                  <td>
                    <div className="table-actions">
                      <Button 
                        size="small" 
                        variant="secondary"
                        onClick={() => handleEdit(line)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="small" 
                        variant="danger"
                        onClick={() => handleDelete(line)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {purchaseLines.length === 0 && (
            <div className="empty-state">
              <p>No tienes líneas de compra registradas</p>
              <Button onClick={() => setShowForm(true)}>+ Agregar primera línea de compra</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseLines;
