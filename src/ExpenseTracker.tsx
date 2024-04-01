import React, {
  createContext,
  useMemo,
  useReducer,
  useState,
  useEffect,
} from "react";
import {
  Button,
  ButtonGroup,
  TextField,
  Modal,
  Box,
  Typography,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel,
  Fab,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
} from "@mui/material/";
import ProgressBar from "react-bootstrap/ProgressBar";
import "bootstrap/dist/css/bootstrap.min.css";
import AddIcon from "@mui/icons-material/Add";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import {
  AccessTime,
  Attractions,
  DirectionsCar,
  Receipt,
  Checkroom,
  Home,
  LocalHospital,
  School,
  RequestQuote,
  Apps,
} from "@mui/icons-material";
var randomColor = require("randomcolor");

// Expense type
export type ExpenseType = {
  title: string;
  description: string;
  date: string;
  category: string;
  amount: number;
  completed: boolean;
};

// define expense category enum
enum Category {
  CurrentSpending = "Current spending",
  Entertainment = "Entertainment",
  Transport = "Transport",
  Bills = "Bills",
  Clothing = "Clothing",
  Home = "Home",
  Health = "Health",
  Education = "Education",
  TaxesAndFees = "Taxes and fees",
  Others = "Others",
}

// define icons for expense categories
const categoryIcons = {
  "Current spending": AccessTime,
  Entertainment: Attractions,
  Transport: DirectionsCar,
  Bills: Receipt,
  Clothing: Checkroom,
  Home: Home,
  Health: LocalHospital,
  Education: School,
  "Taxes and fees": RequestQuote,
  Others: Apps,
};

// category icon getter
const getCategoryIcon = (category: string) => {
  const IconComponent = categoryIcons[category];
  return IconComponent ? <IconComponent /> : null;
};

// define the expense context
const ExpenseContext = createContext<any>({ expenses: [], dispatch: () => {} });

// define the action types
enum ActionType {
  ADD_EXPENSE = "ADD_EXPENSE",
  DELETE_EXPENSE = "DELETE_EXPENSE",
  TOGGLE_EXPENSE_COMPLETED = "TOGGLE_EXPENSE_COMPLETED",
  SORT_EXPENSES_BY_AMOUNT = "SORT_EXPENSES_BY_AMOUNT",
}

// define reducer function
const expenseReducer = (state: ExpenseType[], action: any) => {
  switch (action.type) {
    case ActionType.ADD_EXPENSE:
      return [...state, action.payload];
    case ActionType.DELETE_EXPENSE:
      return state.filter(
        (expense: any, index: number) => index !== action.payload
      );
    case ActionType.TOGGLE_EXPENSE_COMPLETED:
      return state.map((expense: any, index: number) =>
        index === action.payload
          ? { ...expense, completed: !expense.completed }
          : expense
      );
    case ActionType.SORT_EXPENSES_BY_AMOUNT:
      return action.payload;
    default:
      return state;
  }
};

function ExpenseTracker() {
  // use the useReducer hookup to manage the expense state
  // expenseReducer is a reducer function that handles actions that change the expense state
  // [] is the initial state
  const [expenses, dispatch] = useReducer(expenseReducer, [], () => {
    // getting stored value
    const saved = localStorage.getItem("expenses");
    const initialValue = saved !== null ? JSON.parse(saved) : [];
    return initialValue;
  });

  // flag to check if expenses need to be sorted
  const [flagSortExpenses, setFlagSortExpenses] = useState<boolean>(false);
  // the number of the buttongroup button that was selected for display
  const [chosenButton, setChosenButton] = useState<number>(0);
  // flag if the modal should be open
  const [openModal, setOpenModal] = useState<boolean>(false);
  // flag if the snackbar should be open
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);

  // new expense properties
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("Current spending");
  const [amount, setAmount] = useState<string>("");
  const [completed, setCompleted] = useState<boolean>(false);

  // new expense properties errors
  const titleError: boolean = useMemo(() => title.length < 1, [title]);
  const descriptionError: boolean = useMemo(
    () => description.length < 1,
    [description]
  );
  const amountError: boolean = useMemo(() => !/^\d+$/.test(amount), [amount]);

  useEffect(() => {
    // store new expenses value if expenses change
    localStorage.setItem("expenses", JSON.stringify(expenses));
    // sort expenses if needed (after added new one)
    if (flagSortExpenses) sortExpenses();
  }, [expenses]);

  // calculate amount for the given category
  const calculateCategoryAmount = (category: Category): number => {
    const categoryExpenses = expenses.filter(
      (exp, index) => exp.category === category
    );
    let categoryAmount: number = 0;
    categoryExpenses.map((exp, index) => (categoryAmount += exp.amount));
    return categoryAmount;
  };

  // open modal
  const handleOpenModal = () => setOpenModal(true);
  // close modal
  const handleCloseModal = () => setOpenModal(false);
  // open snackbar
  const handleClickSnackbar = () => {
    setOpenSnackbar(true);
  };
  // close snackbar
  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    // snackbar was closed by click away
    if (reason === "clickaway") {
      return;
    }

    setOpenSnackbar(false);
  };

  // generate new expense date
  const generateDate = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");

    const id = `${year}-${month}-${day} ${hours}:${minutes}`;
    return id;
  };

  // helper texts
  const getHelperTextTitle = useMemo(
    () => (titleError === true ? "Title too short" : ""),
    [titleError]
  );
  const getHelperTextDescription = useMemo(
    () => (descriptionError === true ? "Description too short" : ""),
    [descriptionError]
  );
  const getHelperTextAmount = useMemo(
    () => (amountError === true ? "Invalid amount" : ""),
    [amountError]
  );

  // filters
  const [sortOrder, setSortOrder] = useState({
    amount: "asc",
    date: "desc",
  });

  // expense sorting function
  const handleSortByAmount = () => {
    const sortedData = [...expenses].sort((a, b) => {
      if (sortOrder.amount === "asc") {
        return a.amount - b.amount;
      } else {
        return b.amount - a.amount;
      }
    });
    // send the action to the reducer using the dispatch function
    dispatch({ type: ActionType.SORT_EXPENSES_BY_AMOUNT, payload: sortedData });
    setSortOrder({
      ...sortOrder,
      amount: sortOrder.amount === "asc" ? "desc" : "asc",
    });
  };

  const addExpense = () => {
    const newExpense: ExpenseType = {
      title: title,
      description: description,
      date: generateDate(),
      category: category,
      amount: parseInt(amount),
      completed: completed,
    };
    // send the action to the reducer using the dispatch function
    dispatch({ type: ActionType.ADD_EXPENSE, payload: newExpense });

    // clear modal fields
    setTitle("");
    setDescription("");
    setCategory("Current spending");
    setAmount("");
    setCompleted(false);

    // open snackbar
    handleClickSnackbar();

    // set flag to sort expenses with the new one
    setFlagSortExpenses(true);

    // close modal
    handleCloseModal();
  };

  const sortExpenses = () => {
    // set flag not to sort expenses with the new one
    setFlagSortExpenses(false);
    const sortedData = [...expenses].sort((a, b) => {
      if (sortOrder.amount === "asc") {
        return a.amount - b.amount;
      } else {
        return b.amount - a.amount;
      }
    });
    // send the action to the reducer using the dispatch function
    dispatch({ type: ActionType.SORT_EXPENSES_BY_AMOUNT, payload: sortedData });
  };

  const deleteExpense = (expenseId: number) => {
    // send the action to the reducer using the dispatch function
    dispatch({ type: ActionType.DELETE_EXPENSE, payload: expenseId });
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    // converting values from event to Category type
    setCategory(event.target.value as Category);
  };

  // calculate total amount from all expense categories
  const calculateAmount = (): number => {
    let totalAmount: number = 0;
    expenses.map((expense, index) => {
      totalAmount += expense.amount;
    });
    return totalAmount;
  };

  // function to change expense comleted status
  const changeExpenseCompleted = (expenseId: number) => {
    // send the action to the reducer using the dispatch function
    dispatch({ type: ActionType.TOGGLE_EXPENSE_COMPLETED, payload: expenseId });
  };

  return (
    // expense state (expenses) and the dispatch function available using ExpenseContext.Provider
    // so that they are available to all components nested in ExpenseContext
    <ExpenseContext.Provider value={{ expenses, dispatch }}>
      <h1 className="expensetracker-title">Expense Tracker</h1>
      <div>
        {/* Button group for view switching */}
        <ButtonGroup
          className="buttongroup"
          variant="contained"
          orientation="horizontal"
          size="large"
        >
          <Button className="all-button" onClick={() => setChosenButton(0)}>
            All
          </Button>
          <Button
            className="category-summary-button"
            onClick={() => setChosenButton(1)}
          >
            Category summary
          </Button>
        </ButtonGroup>
      </div>

      {/* Code block displaying list of expenses, adding and deleting expenses */}
      {chosenButton === 0 && (
        <>
          <div className="amount-container">
            <p className="amount-p">Amount: ${calculateAmount()}</p>
          </div>
          {/* Container for sorting by amount */}
          <div className="sort-amount-container">
            <Button className="sort-amount-button" onClick={handleSortByAmount}>
              Amount{" "}
              {sortOrder.amount === "asc" ? (
                <FontAwesomeIcon icon={faArrowDown} />
              ) : (
                <FontAwesomeIcon icon={faArrowUp} />
              )}
            </Button>
          </div>
          {/* Modal to add a new expense */}
          <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box className="box-container">
              <Typography id="modal-modal-title" variant="h6" component="h2">
                <h3>Add Expense</h3>
              </Typography>
              <TextField
                className="text-field-modal"
                id="outlined-controlled"
                label="Title"
                value={title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setTitle(event.target.value);
                }}
                helperText={getHelperTextTitle}
                error={titleError}
              />
              <TextField
                className="text-field-modal"
                id="outlined-controlled"
                label="Description"
                value={description}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setDescription(event.target.value);
                }}
                helperText={getHelperTextDescription}
                error={descriptionError}
              />
              <Select
                className="text-field-modal"
                value={category}
                onChange={handleCategoryChange}
              >
                {Object.values(Category).map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setAmount(event.target.value);
                }}
                id="outlined-adornment-amount"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                className="text-field-modal"
                label="Amount"
                value={amount}
                helperText={getHelperTextAmount} // call the function if amount isn't valid
                error={amountError}
              />
              <>
                <div className="purple-checkbox-div">
                  <FormControlLabel
                    control={
                      <Checkbox
                        className="purple-checkbox"
                        onClick={() => setCompleted(!completed)}
                      />
                    }
                    label="Paid"
                  />
                </div>
                <div className="add-expense-button-container">
                  <Button
                    variant="contained"
                    disabled={titleError || descriptionError || amountError}
                    onClick={addExpense}
                    className={`save-expense-button ${
                      titleError || descriptionError || amountError
                        ? "error"
                        : ""
                    }`}
                  >
                    Save Expense
                  </Button>
                </div>
              </>
            </Box>
          </Modal>
          {/* Snackbar for notifications of the success of adding a new expense*/}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              className="full-width-alert"
              onClose={handleCloseSnackbar}
              severity="success"
              variant="filled"
            >
              Expense adding succeeded!
            </Alert>
          </Snackbar>
          {/* Expense table */}
          <TableContainer
            component={Paper}
            className="all-expenses-tablecontainer"
          >
            <Table
              stickyHeader
              className="all-expenses-table"
              aria-label="simple table"
            >
              <TableHead className="all-expenses-tablehead">
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell
                      style={
                        expense.completed
                          ? { textDecoration: "line-through" }
                          : {}
                      }
                    >
                      {expense.title}
                    </TableCell>
                    <TableCell
                      style={
                        expense.completed
                          ? { textDecoration: "line-through" }
                          : {}
                      }
                    >
                      {expense.description}
                    </TableCell>
                    <TableCell
                      style={
                        expense.completed
                          ? { textDecoration: "line-through" }
                          : {}
                      }
                    >
                      {expense.date}
                    </TableCell>
                    <TableCell
                      style={
                        expense.completed
                          ? { textDecoration: "line-through" }
                          : {}
                      }
                    >
                      {expense.category}
                    </TableCell>
                    <TableCell
                      style={
                        expense.completed
                          ? { textDecoration: "line-through" }
                          : {}
                      }
                    >
                      ${expense.amount}
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Checkbox
                            className="purple-checkbox"
                            checked={expense.completed}
                            onClick={() => changeExpenseCompleted(index)}
                          />
                        }
                        label="Paid"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        className="delete-button"
                        variant="contained"
                        onClick={() => deleteExpense(index)}
                      >
                        DELETE
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="add-fab-div">
            <Fab className="add-fab" onClick={handleOpenModal} aria-label="add">
              <AddIcon />
            </Fab>
          </div>
        </>
      )}
      {/* Code block displaying category summary */}
      {chosenButton === 1 && (
        <>
          <table className="categories-icon-table">
            <tbody>
              {Object.values(Category).map((cat) => (
                <tr key={cat} className="categories-icon-tr">
                  <td
                    className="categories-icon-td"
                    style={{
                      backgroundColor: randomColor({
                        hue: "blue",
                        luminosity: "light",
                      }),
                    }}
                  >
                    {getCategoryIcon(cat)}
                  </td>
                  <td className="categories-categories-td">
                    <h6>{cat}</h6>
                  </td>
                  <td className="categories-progressbar-td">
                    <ProgressBar
                      className="categories-progressbar"
                      now={
                        (calculateCategoryAmount(cat) * 100) / calculateAmount()
                      }
                    />
                  </td>
                  <td className="categories-amount-td">
                    <h6>Amount: </h6>${calculateCategoryAmount(cat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </ExpenseContext.Provider>
  );
}

export default ExpenseTracker;
